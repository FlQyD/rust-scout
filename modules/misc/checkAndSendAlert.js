/**
 * Alerts:
 *   - massReportAbusive: Player got more then 4 abusive report in the last 24 hours.
 *   - massReportCheating: Player got more then 4 cheating report in the last 24 hours.
 *   - susCheating: Player with less then 150 hours has 5 or higher KD
 */
import sendAlert from "../discord/discordBot.js";

/**
 * 
 * @param {Object} player - Player object from the core.players
 */
export default async function checkPlayerIfAlertIsNeeded(player, now) {
    const ONE_DAY = 24*60*60*1000;
    const barrier = now - ONE_DAY;

    const recentKills = player.kills.filter(kill => kill.timestamp > barrier).length;
    const recentDeaths = player.deaths.filter(death => death.timestamp > barrier).length;
    const recentKd = recentDeaths === 0 ? (recentKills/1).toFixed(2) : (recentKills/recentDeaths).toFixed(2);
    
    const recentUniqueCheatReports = getUniqueRecentReportCount(player.reports.cheat, barrier);
    const recentUniqueAbusiveReports = getUniqueRecentReportCount(player.reports.toxic, barrier);
    //console.log(`${player.bmId} ${player.hours}h\n  K: ${recentKills} D: ${recentDeaths} KD: ${recentKd}\n  reports(c): ${recentUniqueCheatReports} reports(a): ${recentUniqueAbusiveReports}`);
    
    if (player.lastAlerts.massReportedCheating < barrier) {  //Send out massReportedCheating alert if needed
        if (recentUniqueCheatReports > 3) {
            player.lastAlerts.massReportedCheating = Date.now();
            sendAlert("massReportedCheating",{
                recentKills, recentDeaths, recentKd, recentUniqueCheatReports,
                name: player.name,
                hours: player.hours,
                bmId: player.bmId,
                steamId: player.steamId,
            })
        }
    }

    if (player.hours < 150 && player.hours >= 0 && recentKd >= 6) { //Send out susCheating alert if needed
        if (player.lastAlerts.susCheating < barrier) {
            player.lastAlerts.susCheating = Date.now();
            sendAlert("susCheating",{
                recentKills, recentDeaths, recentKd, recentUniqueCheatReports,
                name: player.name,
                hours: player.hours,
                bmId: player.bmId,
                steamId: player.steamId,
            })
        }
    }

    if (player.lastAlerts.massReportedAbusive < barrier) {  //Send out massReportedAbusive alert if needed
        if (recentUniqueAbusiveReports > 3) {
            player.lastAlerts.massReportedAbusive = Date.now();
            sendAlert("massReportedAbusive", {
                recentKills, recentDeaths, recentKd, recentUniqueAbusiveReports,
                name: player.name,
                hours: player.hours,
                bmId: player.bmId,
                steamId: player.steamId,
            })
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