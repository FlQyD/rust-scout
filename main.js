import fs from 'fs';
import config from "./config/config.js";
import { sendAlert } from "./modules/discord/discordBot.js";

import { altCheckProcess } from "./modules/battleMetrics/altCheckProcess.js";
import requestAndProcessActivity from "./modules/battleMetrics/requestActivity.js";
import timePlayed from "./modules/battleMetrics/timePlayed.js";

import checkPlayerIfAlertIsNeeded from "./modules/misc/checkAndSendAlert.js";
import checkConfig from "./modules/misc/checkConfig.js";


if (!fs.existsSync("./data")) fs.mkdirSync("./data");

export const core = loadCore();
export const altCheck = loadAltCheck();
export const alerts = loadAlerts();

const altCheckQueue = [];
const hourRequestQueue = [];

warmUp();
async function warmUp() {
    await checkConfig();
    resetNotificationSettings();

    requestHours();
    altChecker();
    garbageCollector();

    //Populate hourRequestQueue on start
    for (const playerId in core.players) {
        if (core.players[playerId].hours < 0 &&
            core.players[playerId].hours > -10
        ) hourRequestQueue.push(playerId)
    }
    //Populate altCheckQueue on start
    for (const playerId in core.players) {
        if (altCheck.playerData[playerId]) continue;
        altCheckQueue.push(playerId);
    }
    await new Promise(r => { setTimeout(() => { r() }, 2000); })
    main();
}
function resetNotificationSettings() {
    const prevNotifications = JSON.parse(JSON.stringify(core.notifications));

    const newNotifications = getAlertIds().map(alert => alert.toLowerCase());
    const newCoreNotificationObject = {};

    newNotifications.forEach(alert => {
        newCoreNotificationObject[alert] = prevNotifications[alert] ? [...prevNotifications[alert]] : [];
    })

    core.notifications = newCoreNotificationObject;
}

async function main() {
    while (true) {
        await requestAndProcessActivity(core);
        await new Promise(r => { setTimeout(() => { r() }, 25000); })
        saveCore();
        saveAltCheck();
        await new Promise(r => { setTimeout(() => { r() }, 35000); })
    }
}

/**
 * 
 * @param {String} bmId - battlemetrics ID
 * @param {String} steamId - steamID of the player
 * @param {String} name - name of the player
 * @param {String} action - join | killed | report
 * @param {Object} data - Object that contains the information about the update
 */
export function updatePlayer(bmId, steamId, name, action, data) {
    let player = core.players[bmId];

    if (bmId === undefined) return;
    if (player === undefined) {
        player = newPlayerProfile(bmId, steamId, name);
        core.players[bmId] = player;
        if (!hourRequestQueue.includes(bmId)) hourRequestQueue.push(bmId);
    }
    if (player.name !== name) player.name = name;
    if (player.steamId === "unknown" && steamId !== "unknown") player.steamId = steamId;

    player.lastUpdated = Date.now();

    if (action === "join") {
        checkIfPlayerIsOnTheWatchList(player);
        checkIfPlayerHasBeenBackgroundChecked(player.bmId);
        return; //No additional check is needed
    }
    if (action === "kill") {
        if (data.killedBmId == undefined) return;
        player.kills.push({ killed: data.killedBmId, timestamp: data.timestamp });
    }
    if (action === "death") {
        if (data.killerBmId == undefined) return;
        player.deaths.push({ killer: data.killerBmId, timestamp: data.timestamp });
    }
    if (action === "report") {
        if (data.reporterBmId == undefined) return;
        if (data.reportType === "cheat") {
            player.reports.cheat.push({ timestamp: data.timestamp, reporter: data.reporterBmId });
        } else if (data.reportType === "abusive") {
            player.reports.toxic.push({ timestamp: data.timestamp, reporter: data.reporterBmId });
        }
    }
    checkPlayerIfAlertIsNeeded(player, core.lastProcessed);
}
function newPlayerProfile(bmId, steamId, name) {
    return {
        bmId: String(bmId),
        steamId: String(steamId),
        name: String(name),
        hours: -1,
        kills: [],
        deaths: [],
        reports: {
            cheat: [],
            toxic: [],
        },
        lastAlerts: {},
        lastUpdated: core.lastProcessed,
    };
}

export async function updateAlertNotifications(interaction) {
    if (interaction.channel.id !== config.discord.channelId)
        return await interaction.reply({ content: `You cannot use this command in this channel.`, flags: 64 });

    const userId = interaction.user.id;
    const alerts = getAlertIds();

    let content = "Your current notification settings: ```"
    alerts.forEach(alert => {
        const payload = interaction.options.getBoolean(alert.toLowerCase());
        content += `${alert}: ${updateNotification(alert.toLowerCase(), payload, userId)}\n`;
    })
    content += "```";

    await interaction.reply({ content, flags: 64 });
}
function updateNotification(type, value, user) {
    if (value === false && core.notifications[type].includes(user)) {
        core.notifications[type] = removerItemFromArray(core.notifications[type], user);
    } else if (value === true && !core.notifications[type].includes(user)) {
        core.notifications[type].push(user);
    }
    return core.notifications[type].includes(user);
}
export function getAlertIds(params) {
    const ids = [];

    if (alerts.rgbFound.enabled) ids.push("rgbFound");
    alerts.customs.forEach(alert => ids.push(alert.id))

    return ids;
}


async function requestHours() {
    while (true) {
        let extraTime = 0;
        const playerId = hourRequestQueue.shift();
        if (playerId === undefined) {
            await new Promise(r => { setTimeout(() => { r() }, 500); });
            continue;
        }

        const player = core.players[playerId];
        if (player.hours > -1) continue; //Already set
        if (player.hours < -9) continue; //Failed more then 10 times

        extraTime = await requestHoursForPlayer(playerId);
        await new Promise(r => { setTimeout(() => { r() }, 500 + extraTime); });
    }
}
async function requestHoursForPlayer(playerId) {
    const player = core.players[playerId];
    const response = await timePlayed(playerId)
    if (response.timePlayed === "error") {
        player.hours--;
        hourRequestQueue.push(playerId);
        return 5000;
    }
    player.hours = Math.floor(response.timePlayed / 3600);
    checkPlayerIfAlertIsNeeded(player, core.lastProcessed);
    return response.extraTime;
}

async function altChecker() {
    while (true) {
        await new Promise(r => { setTimeout(() => { r() }, 5000); })

        const player = altCheckQueue.shift();
        if (player == undefined) continue;
        if (altCheck.playerData[player]) continue;

        const outcome = await altCheckProcess(player);
        if (outcome === "error") continue;

        outcome.timestamp = Date.now();
        altCheck.playerData[player] = outcome;

        if (outcome.possibleAlts === 0) return; //No alts was found

        const data = {
            steamId: core.players[player]?.steamId,
            bmId: core.players[player]?.bmId,
            name: core.players[player]?.name,
            count: outcome.possibleAlts,
        }
        const content = "";

        sendAlert(content, alerts.rgbFound, data);
    }
}

function checkIfPlayerHasBeenBackgroundChecked(bmId) {
    if (!alerts.rgbFound.enabled) return; //NO RGB Account search

    if (altCheck.ignoreList[bmId]) return;     //On the ignore list
    if (altCheck.playerData[bmId]) return;    //Already checked
    if (altCheckQueue.includes(bmId)) return; //Waiting to be checked

    altCheckQueue.push(bmId);
}
function checkIfPlayerIsOnTheWatchList(player) {
    if (!alerts.watchlist.enabled) return; //Watchlist disabled

    const playerId = player.bmId;
    if (!core.watchlist[playerId]) return false; //Player is not on the watchlist;

    //SEND WATCHLIST ALERT

    const data = JSON.parse(JSON.stringify(player));
    data.note = core.watchlist[playerId].note;
    data.adminName = core.watchlist[playerId].adminName;
    data.adminAvatar = core.watchlist[playerId].adminAvatar;

    const content = core.watchlist[playerId].notify === "only-me" ?
        core.watchlist[playerId].notificationList.map(account => `<@${account}>`).join(" ") :
        `<&${config.discord.staffRoleId}>`;

    sendAlert(content, alerts.watchlist, data);
}
export function removePlayerFromTheWatchList(bmId) {
    delete core.watchlist[bmId];
}

function loadCore() {
    try {
        const data = fs.readFileSync("./data/core.json", "utf8");
        if (data === "") return { players: {}, watchlist: {}, lastProcessed: 0, notifications: {} };
        return JSON.parse(data);
    } catch (error) {
        console.error(`Core loading failed. Regenerating an empty core.\n  ${error.message}`);
        return { players: {}, watchlist: {}, lastProcessed: 0, notifications: {} }
    }
}
function loadAltCheck() {
    try {
        const data = fs.readFileSync("./data/altCheck.json", "utf8");
        if (data === "") return { playerData: {}, ignoreList: {} };
        return JSON.parse(data);
    } catch (error) {
        console.error(`AltCheck loading failed. Regenerating an empty AltCheck.\n  ${error.message}`);
        return { playerData: {}, ignoreList: {} };
    }
}
function loadAlerts() {
    try {
        const data = fs.readFileSync("./config/alertConfig.json");
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`alertConfig.json couldn't be loaded: ${error.message}`);
    }
}

let coreSaving = false;
function saveCore() {
    try {
        if (coreSaving) return;
        coreSaving = true;
        fs.writeFileSync("./data/core.json", JSON.stringify(core));
        console.log(getTimeString() + " | Core saved!");
    } catch (error) {
        console.error(error);
    } finally {
        coreSaving = false;
    }
}
let altCheckSaving = false;
function saveAltCheck() {
    try {
        if (altCheckSaving) return;
        altCheckSaving = true;
        fs.writeFileSync("./data/altCheck.json", JSON.stringify(altCheck));
        console.log(getTimeString() + " | AltCheck saved!");
    } catch (error) {
        console.error(error);
    } finally {
        altCheckSaving = false;
    }
}

async function garbageCollector() {
    while (true) {
        deleteOldAltData();
        deleteOldPlayerData();
        deleteOldWatchlistData();
        await new Promise(r => { setTimeout(() => { r() }, 3600000); })
    }
}
function deleteOldPlayerData() {
    const barrier = core.lastProcessed - 36 * 60 * 60 * 1000;
    const dataBarrier = core.lastProcessed - 12 * 60 * 60 * 1000;

    for (const playerId in core.players) {

        const player = core.players[playerId]
        if (player.lastUpdated < barrier) {
            console.log(`GARBAGE COLLECTION: ${player.name} was deleted with the ID of ${player.bmId}`);
            delete core.players[playerId];

            continue
        }

        player.kills = filterOldDataFromArray(player.kills, dataBarrier);
        player.deaths = filterOldDataFromArray(player.deaths, dataBarrier);
        player.reports.cheat = filterOldDataFromArray(player.reports.cheat, dataBarrier);
        player.reports.toxic = filterOldDataFromArray(player.reports.toxic, dataBarrier);
    }
}
function deleteOldWatchlistData() {
    const barrier = core.lastProcessed - 60 * 24 * 60 * 60 * 1000;
    for (const watchlistId in core.watchlist) {
        const watchlistItem = core.watchlist[watchlistId]
        if (watchlistItem.timestamp < barrier) {
            console.log(`GARBAGE COLLECTION: ${watchlistId} was deleted from the watchlist!`);
            delete core.watchlist[watchlistId];
            continue
        }
    }
}
function deleteOldAltData() {
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    for (const alt in altCheck.playerData) {
        const timestamp = altCheck.playerData[alt].timestamp;
        if (timestamp < (core.lastProcessed - ONE_MONTH)) {
            delete altCheck.playerData[alt]
            console.log(`GARBAGE COLLECTION: ${alt} was removed from alt data`);
        }
    }
    for (const ignored in altCheck.ignoreList) {
        const timestamp = altCheck.ignoreList[ignored];
        if (timestamp < (core.lastProcessed - ONE_MONTH * 6)) {
            delete altCheck.ignoreList[ignored]
            console.log(`GARBAGE COLLECTION: Ignored ${ignored} was removed from alt ignore list.`);
        }
    }

}

function filterOldDataFromArray(array, barrier) {
    const newArray = array.filter(item => item.timestamp > barrier);
    return newArray;
}
function removerItemFromArray(array, itemToRemove) {
    return array.filter(item => item !== itemToRemove);
}

export async function logError(text) {
    try {
        await new Promise((res, rej) => {
            fs.appendFile("./error.log", `${text}\n\n`, (err) => {
                if (err) return rej(err);
                return res();
            });
        });
    } catch (error) {
        console.error(error);
    }
}
export function getTimeString() {
    return new Date(Date.now()).toISOString().substring(0, 19).replace("T", " | ")
}



process.on('uncaughtException', async error => {
    try {
        await logError(`${getTimeString()} | ${error.stack.toString()}`);
        console.error(`${getTimeString()} | ${error.message}`);
    } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
    } finally {
        process.exit(1);
    }
});