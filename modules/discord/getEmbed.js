import { EmbedBuilder } from 'discord.js';

export default function getEmbed(type, data, alert) {
    if (type === "watchListAlert") {
        return getWatchListEmbed(data);
    } else if (type === "possibleRgbAccountFound") {
        return getPossibleRgbAccountFoundEmbed(data);
    }

    return getCustomEmbed(alert, data);
}
function getCustomEmbed(alert, data) {
    const embedContent = replaceEmbedContent(alert.embed, data)
    console.log(embedContent);
    
    const embed = new EmbedBuilder()
    if (embedContent.title) embed.setTitle(embedContent.title);
    if (embedContent.url) embed.setURL(embedContent.url)
    if (embedContent.description) embed.setDescription(embedContent.description);
    if (embedContent.color) embed.setColor(Number(embedContent.color));

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

function replaceEmbedContent(embed, data) {    
    const newEmbed = {};
    console.log(embed);
    
    for (const item in embed) {
        let value = String(embed[item]);
        
        value = value.replaceAll("{BM_ID}", data.bmId);
        value = value.replaceAll("{STEAM_ID}", data.steamId);
        value = value.replaceAll("{RECENT_KILLS}", data.recentKills);
        value = value.replaceAll("{RECENT_DEATHS}", data.recentDeaths);
        value = value.replaceAll("{RECENT_KD}", data.recentKd);
        value = value.replaceAll("{RECENT_UNIQUE_KILLS}", data.recentUniqueKills);
        value = value.replaceAll("{RECENT_UNIQUE_DEATHS}", data.recentUniqueDeaths);
        value = value.replaceAll("{RECENT_CHEATING_REPORTS}", data.recentCheatReports);
        value = value.replaceAll("{RECENT_ABUSIVE_REPORT_COUNT}", data.recentAbusiveReports);
        value = value.replaceAll("{RECENT_UNIQUE_CHEATING_REPORT}", data.recentUniqueCheatReports);
        value = value.replaceAll("{RECENT_UNIQUE_ABUSIVE_REPORT}", data.recentUniqueAbusiveReports);
        value = value.replaceAll("{HOURS}", data.hours);
        value = value.replaceAll("{NAME}", data.name)

        newEmbed[item] = value;
    }
    return newEmbed;
}