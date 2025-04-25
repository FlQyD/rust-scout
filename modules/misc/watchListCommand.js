import config from "../../config/config.js";
import {core, logError } from "../../main.js";

export default async function watchListCommand(interaction) {
    const idGiven = interaction.options.getString('bm-id-or-steam-id');
    const notify = interaction.options.getString('notify') === null ? "only-me" : interaction.options.getString('notify');
    const note = interaction.options.getString('note');
    const action = interaction.options.getString('action') === null ? "add" : interaction.options.getString('action');
    const user = interaction.user.id;
    const username = interaction.user.username
    const userAvatar = interaction.user.displayAvatarURL({ size: 64, dynamic: true })

    if (!isItNumber(idGiven)) return interaction.reply({ content: `The ID given is neither a steam ID or a battlemetrics ID: ${idGiven}.`, flags: 64 })

    let steamId = idGiven.length === 17 ? idGiven : undefined;
    let bmId = idGiven.length === 17 ? undefined : idGiven;

    if (bmId === undefined) {
        bmId = await getBmId(steamId);
        if (bmId === "error") return interaction.reply({ content: `Something went wrong requesting the battlemetrics ID for the steamID. Try again later.`, flags: 64 })
        if (bmId === undefined) return interaction.reply({ content: `Battlemetrics ID wasn't found for the steamID given: ${idGiven}`, flags: 64 });
    }

    console.log(idGiven, notify, note, action, user, username, userAvatar);
    if (action === "remove") {
        if (core.watchlist[idGiven]) {
            delete core.watchlist[idGiven]
            return interaction.reply({ content: `Player was removed form the watchlsit.`, flags: 64 });
        }
        return interaction.reply({ content: `There is no player with ${idGiven} ID on the watchlsit.`, flags: 64 });
    }
    //ADD TO THE WATCHLIST
    if (core.watchlist[bmId]) { //Player is already on the watchlist
        if (core.watchlist[bmId].notify === "staff") 
            return interaction.reply({ content: `This player is already on the watchlist with BM ID: \`${bmId}\`, and you will be notified when he joins the server.`, flags: 64 });
        if (core.watchlist[bmId].notificationList.includes(user)) 
            return interaction.reply({ content: `This player is already on the watchlist with BM ID: \`${bmId}\`, and you will be notified when he joins the server.`, flags: 64 });
        core.watchlist[bmId].notificationList.push(user);
        return interaction.reply({ content: `This player is already on the watchlist with BM ID: \`${bmId}\`, you have been added to the notification list.`, flags: 64 });
    }

    const watchListObject = {
        notify, note,
        adminName:username, 
        adminAvatar: userAvatar,
        notificationList: [user],
        timestamp: core.lastProcessed,
    }
        
    core.watchlist[bmId] = watchListObject;
    return await interaction.reply({ content: `Player was added to the watchlist with a battlemetrics ID: ${bmId}`, flags: 64 });
}
function isItNumber(string) {
    return /^[0-9]+$/.test(string);
}
async function getBmId(steamId) {
    try {
        const response = await fetch("https://api.battlemetrics.com/players?version=^0.1.0&page[size]=100&fields[identifier]=type,identifier,lastSeen,metadata&filter[public]=false&filter[search]=" + steamId + "&filter[playerFlags]=&include=identifier&access_token=" + config.battleMetrics.accessToken)
        const data = await response.json();

        for (const identifier of data.included) {
            if (identifier.attributes.type === "steamID") {
                if (steamId === identifier.attributes.identifier) {
                    return identifier.relationships.player.data.id;
                }
            }
        }
        return undefined;
    } catch (error) {
        logError(error.stack.toString())
        console.log(error);
        return "error";
    }
}
