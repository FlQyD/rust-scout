import { EmbedBuilder } from 'discord.js';

export default function getEmbed(data, alert) {
    const embedContent = replaceEmbedContent(alert.embed, data)
    
    const embed = new EmbedBuilder()
    if (embedContent.title) embed.setTitle(embedContent.title);
    if (embedContent.url) embed.setURL(embedContent.url)
    if (embedContent.description) embed.setDescription(embedContent.description);
    if (embedContent.color) embed.setColor(Number(embedContent.color));
    if (embedContent.authorName || embedContent.authorIcon) {
        embed.setAuthor({
            name: embedContent.authorName,
            iconURL: embedContent.authorIcon
        })
    }
    if (embedContent.footer) embed.setFooter({
        text: embedContent.footer
    })
    return embed;
}
function replaceEmbedContent(embed, data) {    
    const newEmbed = {};
    for (const item in embed) {
        let value = String(embed[item]);
        
        value = value.replaceAll("{BM_ID}", data.bmId ? data.bmId : "N/A");
        value = value.replaceAll("{STEAM_ID}", data.steamId ? data.steamId : "N/A");
        value = value.replaceAll("{RECENT_KILLS}", data.recentKills ? data.recentKills : "N/A");
        value = value.replaceAll("{RECENT_DEATHS}", data.recentDeaths ? data.recentDeaths : "N/A");
        value = value.replaceAll("{RECENT_KD}", data.recentKd ? data.recentKd : "N/A");
        value = value.replaceAll("{RECENT_UNIQUE_KILLS}", data.recentUniqueKills ? data.recentUniqueKills : "N/A");
        value = value.replaceAll("{RECENT_UNIQUE_DEATHS}", data.recentUniqueDeaths ? data.recentUniqueDeaths : "N/A");
        value = value.replaceAll("{RECENT_CHEATING_REPORTS}", data.recentCheatReports ? data.recentCheatReports : "N/A");
        value = value.replaceAll("{RECENT_ABUSIVE_REPORT}", data.recentAbusiveReports ? data.recentAbusiveReports : "N/A");
        value = value.replaceAll("{RECENT_UNIQUE_CHEATING_REPORT}", data.recentUniqueCheatReports ? data.recentUniqueCheatReports : "N/A");
        value = value.replaceAll("{RECENT_UNIQUE_ABUSIVE_REPORT}", data.recentUniqueAbusiveReports ? data.recentUniqueAbusiveReports : "N/A");
        value = value.replaceAll("{HOURS}", data.hours && data.hours >= 0 ? data.hours : "N/A");
        value = value.replaceAll("{NAME}", data.name ? data.name : "N/A");
        value = value.replaceAll("{NOTE}", data.note ? data.note : "N/A");
        value = value.replaceAll("{ADMIN_NAME}", data.adminName ? data.adminName : "N/A");
        value = value.replaceAll("{ADMIN_AVATAR}", data.adminAvatar ? data.adminAvatar : "N/A");
        value = value.replaceAll("{COUNT}", data.count ? data.count : "N/A");
        value = value.replaceAll("{SERVER_NAME}", data.serverName ? data.serverName : "N/A");
        value = value.replaceAll("{SERVER_ID}", data.serverId ? data.serverId : "N/A");
        value = value.replaceAll("{VIOLATION_LEVEL}", data.violationLevel ? data.violationLevel : "N/A");
        value = value.replaceAll("{KICK_MESSAGE}", data.kickMessage ? data.kickMessage : "N/A");
        value = value.replaceAll("{LOCATION}", data.location ? data.location : "N/A");

        newEmbed[item] = value;
    }
    return newEmbed;
}