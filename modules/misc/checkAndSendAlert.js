/**
 * Alerts:
 *   - massReportAbusive: Player got more then 4 abusive report in the last 24 hours.
 *   - massReportCheating: Player got more then 4 cheating report in the last 24 hours.
 *   - susCheating: Player with less then 150 hours has 5 or higher KD
 */
import { alerts } from "../../main.js";
import sendAlert from "../discord/discordBot.js";

/**
 * 
 * @param {Object} player - Player object from the core.players
 */
export default async function checkPlayerIfAlertIsNeeded(player, now) {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const barrier = now - ONE_DAY;

    const recentKills = player.kills.filter(kill => kill.timestamp > barrier).length;
    const recentDeaths = player.deaths.filter(death => death.timestamp > barrier).length;
    const recentKd = recentDeaths === 0 ? Number((recentKills / 1).toFixed(2)) : Number((recentKills / recentDeaths).toFixed(2));

    const recentUniqueKills = getUniqueItems(player.kills, barrier, "killed");
    const recentUniqueDeaths = getUniqueItems(player.deaths, barrier, "killer")

    const recentCheatReports = player.reports.cheat.filter(report => { report.timestamp > barrier }).length;
    const recentAbusiveReports = player.reports.toxic.filter(report => { report.timestamp > barrier }).length;

    const recentUniqueCheatReports = getUniqueRecentReportCount(player.reports.cheat, barrier);
    const recentUniqueAbusiveReports = getUniqueRecentReportCount(player.reports.toxic, barrier);

    const playerData = {
        recentKills, recentDeaths, recentKd,
        recentUniqueKills, recentUniqueDeaths,
        recentCheatReports, recentAbusiveReports,
        recentUniqueCheatReports, recentUniqueAbusiveReports,
        hours: player.hours
    }

    //Check if any alert should be triggered
    for (const alert of alerts) {
        if (player.lastAlerts[alert.id] > barrier) continue;
        let triggered = true;
        for (const trigger of alert.triggers) {
            const currentValue = playerData[trigger.value]
            
            if (trigger.condition.action === "greater-than" && currentValue <= trigger.condition.value) {
                triggered = false;
                break;
            }
            if (triggered && trigger.condition.action === "less-than" && currentValue >= trigger.condition.value) {
                triggered = false;
                break;
            }
            if (triggered && trigger.condition.action === "greater-than-or-equal" && currentValue < trigger.condition.value) {
                triggered = false;
                break;
            }
            if (triggered && trigger.condition.action === "less-than-or-equal" && currentValue > trigger.condition.value) {
                triggered = false;
                break;
            }
        }        
        if (!triggered) continue;

        player.lastAlerts[alert.id] = Date.now();
        
        sendAlert(alert.id, playerData);
    }
}


function getUniqueRecentReportCount(reports, barrier) {
    return reports
        .filter(report => report.timestamp > barrier)
        .map(report => report.reporter)
        .filter((reporter, index, cheatReporters) => cheatReporters.indexOf(reporter) === index)
        .length;
}
function getUniqueItems(array, barrier, type) {    
    return array
        .filter(item => item.timestamp > barrier)
        .map(item => item[type])
        .filter((item, index, inspectedArray) => inspectedArray.indexOf(item) === index)
        .length;
}