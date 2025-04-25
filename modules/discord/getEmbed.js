import { EmbedBuilder } from 'discord.js';

export default function getEmbed(type, data) {
    if (type === "massReportedAbusive") {
        return getMassReportedAbusiveEmbed(data)
    } else if (type === "massReportedCheating") {
        return getMassReportedCheatingEmbed(data)
    } else if (type === "susCheating") {
        return getSusAlertCheatingEmbed(data)
    } else if (type === "watchListAlert") {
        return getWatchListEmbed(data);
    } else if (type === "possibleRgbAccountFound") {
        return getPossibleRgbAccountFoundEmbed(data);
    }
}

function getMassReportedAbusiveEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle('MASS REPORTED - ABUSIVE')
        .setDescription(`\`\`\`name:    ${data.name}\nbmId:    ${data.bmId}\nsteamID: ${data.steamId}\nreports: ${data.recentUniqueAbusiveReports}\n\nhours:  ${data.hours < 0 ? "Private" : data.hours + "h"} \`\`\`\nThis player received more then 3 abusive report in the last 24 hours.`)
        .setColor(14604341)
        .setURL('https://www.battlemetrics.com/rcon/players/' + data.bmId);
    return embed;
}
function getMassReportedCheatingEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle('MASS REPORTED - CHEATING')
        .setDescription(`\`\`\`name:    ${data.name}\nbmId:    ${data.bmId}\nsteamID: ${data.steamId}\nreports: ${data.recentUniqueCheatReports}\n\nhours:  ${data.hours < 0 ? "Private" : data.hours + "h"}\nKILLS:  ${data.recentKills} \nDEATHS: ${data.recentDeaths}\nK/D:    ${data.recentKd} \`\`\`\nThis player received more then 3 cheating report in the last 12 hours.`)
        .setColor(16725576)
        .setURL('https://www.battlemetrics.com/rcon/players/' + data.bmId);
    return embed;
}
function getSusAlertCheatingEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle('SUS ALERT - CHEATING')
        .setDescription(`\`\`\`name:    ${data.name}\nbmId:    ${data.bmId}\nsteamID: ${data.steamId}\nreports: ${data.recentUniqueCheatReports}\n\nhours:  ${data.hours < 0 ? "Private" : data.hours + "h"}\nKILLS:  ${data.recentKills} \nDEATHS: ${data.recentDeaths}\nK/D:    ${data.recentKd}\`\`\`\nLow hour player has reached a high KD.`)
        .setColor(16725576)
        .setURL('https://www.battlemetrics.com/rcon/players/' + data.bmId);
    return embed;
}
function getWatchListEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle("WATCHLIST ALERT")
        .setDescription(`${data.name} joined from the watchlist.\n\`\`\`steam ID: ${data.steamId}\n   bm ID: ${data.bmId}\n    name: ${data.name}${data.note ? "\n\nNote: " + data.note : ""}\`\`\``)
        .setColor(4634623)
        .setURL(`https://www.battlemetrics.com/rcon/players/${data.bmId}`)
        .setAuthor({
            name: `added to watchlist by ${data.adminName}`,
            iconURL: `${data.adminAvatar}`
        })
    return embed;
}
function getPossibleRgbAccountFoundEmbed(data) {
    const embed = new EmbedBuilder()
        .setDescription(
            `**[${data.name}](https://battlemetrics.com/rcon/player/${data.bmId})** is connected to **${data.numberOfPossibleAlts}** game banned accounts.\n`
        )
        .setColor(0x00C9F1)
        .setAuthor({ name: "System - RGB tracker" });
    return embed;
}