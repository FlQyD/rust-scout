import config from "../../config/config.js";
import { alerts, core, getContent, getTimeString, servers, updatePlayer } from "../../main.js";
import { sendAlert } from "../discord/discordBot.js";

const flyHackQueue = [];

export function addToFlyHackQueue(activityMessage) {
    flyHackQueue.push(activityMessage);
    processFlyHackQueue();
}

let flyHackQueueProcessing = false;
async function processFlyHackQueue() {
    if (flyHackQueueProcessing) return;
    flyHackQueueProcessing = true;

    while (flyHackQueue.length > 0) {
        const flyHackObject = flyHackQueue.shift();
        if (flyHackObject !== undefined) await processFlyHackObject(flyHackObject);

        await new Promise(r => { setTimeout(() => r(), 3000); })
    }
    flyHackQueueProcessing = false;
}

async function processFlyHackObject(flyHack) {
    try {        
        const steamId = flyHack.attributes.data.steamID;
        let bmId = flyHack.relationships.players?.data[0]?.id;
        
        if (bmId === undefined) bmId = getBmIdFromCore(steamId);
        if (bmId === undefined) bmId = await requestBmId(steamId);

        if (bmId === undefined || bmId === "error") return;
        //No BM ID was found for this steamID.

        const name = flyHack.attributes.data.playerName;
        const kickMessage = flyHack.attributes.data.warning;
        const location = kickMessage.split(" at ")[1];
        
        const violationLevel = kickMessage.split(" of ")[1]
                                          .substring(0, kickMessage.split(" of ")[1].indexOf(")"));        
        const serverId = flyHack.relationships.servers.data[0].id;
        const serverName = servers.find(server => server.id === serverId)?.name;
        
        if (serverName === undefined) return;
        //Not happened on a watched servers 

        updatePlayer(bmId, steamId, name, "none");

        const hours = core.players[bmId]?.hours;
        if (hours === undefined) hours = -1;

        const content = getContent("flyHackKick");
        
        const embedData = {
            name, bmId, steamId, hours,
            kickMessage, location, violationLevel, 
            serverId, serverName
        }        
        if (await sendAlert(content, alerts.flyHackKick, embedData)) {
            console.log(`${getTimeString()} | flyHackKick was sent to ${bmId}`);
        }else{
            console.error(`Something went wrong while sending flyHackKick alert to: ${steamId} | ${bmId}`);   
        }
    } catch (error) {
        console.log(error);
    }
}

function getBmIdFromCore(steamId) {
    //Check for SteamID in core.players.
    return undefined;
}

async function requestBmId(steamId, count = 0) {
    if (count > 2) return "error";

    const url = `https://api.battlemetrics.com/players?version=^0.1.0&page[size]=10&fields[identifier]=type,identifier&filter[public]=false&filter[search]="${steamId}"&filter[playerFlags]=&include=identifier,flagPlayer,playerFlag,server&access_token=${config.battleMetrics.accessToken}`;
    const resp = await fetch(url);
    if (resp.status !== 200) {
        await new Promise(r => {setTimeout(() => {r()}, 5000)})
        return await requestBmId(steamId, count++);
    }

    const data = await resp.json();
    
    for (const identifier of data.included) {
        if (identifier.type !== "identifier") continue;
        if (!identifier.attributes || identifier.attributes.type !== "steamID") continue;
        if (identifier.attributes.identifier !== steamId) continue;

        return identifier.relationships.player.data.id;
    }
    return undefined;
}