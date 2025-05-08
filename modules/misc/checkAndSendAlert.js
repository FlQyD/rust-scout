import { alerts, getTimeString } from "../../main.js";
import { sendAlert } from "../discord/discordBot.js";

/**
 * @param {Object} player - Player object from the core.players
 */
export default async function checkPlayerIfAlertIsNeeded(player, now, notification) {
    const barrier = now - 12 * 60 * 60 * 1000;

    const recentKills = player.kills.filter(kill => kill.timestamp > barrier).length;
    const recentDeaths = player.deaths.filter(death => death.timestamp > barrier).length;
    const recentKd = recentDeaths === 0 ? Number((recentKills / 1).toFixed(2)) : Number((recentKills / recentDeaths).toFixed(2));

    const recentUniqueKills = getUniqueItemCount(player.kills, barrier, "killed");
    const recentUniqueDeaths = getUniqueItemCount(player.deaths, barrier, "killer")

    const recentCheatReports = player.reports.cheat.filter(report => report.timestamp > barrier ).length;
    const recentAbusiveReports = player.reports.toxic.filter(report => report.timestamp > barrier ).length;

    const recentUniqueCheatReports = getUniqueRecentReportCount(player.reports.cheat, barrier);
    const recentUniqueAbusiveReports = getUniqueRecentReportCount(player.reports.toxic, barrier);

    const playerData = {
        recentKills, recentDeaths, recentKd,
        recentUniqueKills, recentUniqueDeaths,
        recentCheatReports, recentAbusiveReports,
        recentUniqueCheatReports, recentUniqueAbusiveReports,
        hours: player.hours,
        bmId: player.bmId,
        steamId: player.steamId,
        name: player.name
    }    

    //Trigger if any alert should be triggered
    for (const alert of alerts.customs) {
        if (player.lastAlerts[alert.id] > barrier) continue;
        let triggered = true;
        for (const trigger of alert.triggers) {
            const currentValue = playerData[trigger.value]
            if (trigger.value === "hours" && currentValue < 0) { //Don't check hours, if it's not known
                triggered = false;
                break;
            }
            
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
        
        console.log(alert.id);
        console.log(notification[alert.id.toLowerCase()]);
        

        const content = notification[alert.id.toLowerCase()].length == 0 ? 
            "":
            `<@${notification[alert.id.toLowerCase()].join("> <@")}>`;

        if (await sendAlert(content, alert, playerData)) { //Alert Send
            player.lastAlerts[alert.id] = Date.now();
            console.log(`${getTimeString()} | "${alert.id}" was sent to ${playerData.bmId}`);    
        }
    }
}

function getUniqueRecentReportCount(reports, barrier) {
    return reports
        .filter(report => report.timestamp > barrier)
        .map(report => report.reporter)
        .filter((reporter, index, cheatReporters) => cheatReporters.indexOf(reporter) === index)
        .length;
}
function getUniqueItemCount(array, barrier, type) {    
    return array
        .filter(item => item.timestamp > barrier)
        .map(item => item[type])
        .filter((item, index, inspectedArray) => inspectedArray.indexOf(item) === index)
        .length;
}