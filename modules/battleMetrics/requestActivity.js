import config from "../../config/config.js";
import { updatePlayer } from "../../main.js";


export default async function requestAndProcessActivity(core) {
    try {
        const url = "https://api.battlemetrics.com/activity?version=^0.1.0&tagTypeMode=and&filter[types][whitelist]=rustLog:playerReport,rustLog:playerDeath:PVP,event:addPlayer&include=organization,user&page[size]=" + config.battleMetrics.activityLinesRequested + "&page[rel]=next&access_token=" + config.battleMetrics.accessToken;
        const data = await fetch(url);
        const resp = await data.json();

        return processData(resp.data, core);
    } catch (error) {
        console.error(error);
    }
}


async function processData(activityMessages, core) {
    activityMessages = activityMessages.reverse();
    activityMessages.forEach(activityMessage => {
        if (activityMessage.type !== "activityMessage") return;

        const messageSent = new Date(activityMessage.attributes.timestamp).getTime();
        if (core.lastProcessed >= messageSent) return;

        const type = activityMessage.attributes.messageType;
        
        switch (type) {
            case "event:addPlayer": //Player joined
                updatePlayer(
                    String(activityMessage.relationships.players.data[0].id),
                    "unknown",
                    String(activityMessage.attributes.data.name),
                    "join",
                    null
                );
                break;
            case "rustLog:playerDeath:PVP": //Player killed
                if (activityMessage.attributes.data.player_id === undefined) break;
                if (activityMessage.attributes.data.killer_id === undefined) break;
                
                updatePlayer(
                    String(activityMessage.attributes.data.player_id),
                    String(activityMessage.attributes.data.steamID),
                    String(activityMessage.attributes.data.playerName),
                    "death",
                    {
                        killerBmId: String(activityMessage.attributes.data.killer_id),
                        timestamp: messageSent,
                    }
                );
                updatePlayer(
                    String(activityMessage.attributes.data.killer_id),
                    String(activityMessage.attributes.data.killerSteamID),
                    String(activityMessage.attributes.data.killerName),
                    "kill",
                    {
                        killedBmId: String(activityMessage.attributes.data.player_id),
                        timestamp: messageSent,
                    }
                );
                break;
            case "rustLog:playerReport": //Player reported
                updatePlayer(
                    String(activityMessage.attributes.data.forPlayerId),
                    String(activityMessage.attributes.data.forSteamID),
                    String(activityMessage.attributes.data.forPlayerName),
                    "report",
                    {
                        reportType: String(activityMessage.attributes.data.reportType),
                        reporterBmId: String(activityMessage.attributes.data.fromPlayerId),
                        timestamp: messageSent,
                    }
                );
                break;
            default:
                break;
        }
        core.lastProcessed = messageSent;
    });
}