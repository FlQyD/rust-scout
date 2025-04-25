import { Client, Events, GatewayIntentBits, EmbedBuilder, ActionRowBuilder } from 'discord.js';
import { REST, Routes } from 'discord.js';
import commands from "./commands.js"
import getButtons from './getButtons.js';
import getEmbed from './getEmbed.js';
import config from '../../config/config.js';
import { core, altCheck, logError, removePlayerFromTheWatchList, updateAlertNotifications } from '../../main.js';
import watchListCommand from '../misc/watchListCommand.js';
import { pageSwitchButtonPushed, showPlayerProfile } from './altCheckEmbed.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let channel = null;
client.once('ready', async () => {
    try {
        const guild = await client.guilds.fetch(config.discord.guildId);
        channel = await guild.channels.fetch(config.discord.channelId);

        const rest = new REST({ version: '10' }).setToken(config.discord.botAuthToken);
        await rest.put(Routes.applicationCommands(config.discord.botApplicationId), { body: commands });
        console.log('Slash commands reloaded for Discord.');
    } catch (error) {
        logError(error.stack.toString());
        console.log(error.raeError.errors);
        throw error;
    }

    console.log(`${client.user.tag} logged in and found the channel with the ID: ${channel.id} | ${channel.name}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (interaction.commandName === "notify") return updateAlertNotifications(interaction);
    if (interaction.commandName === "watchlist") return watchListCommand(interaction);
    if (!interaction.isButton()) return;

    const { customId, user, message } = interaction;
    const embed = EmbedBuilder.from(message.embeds[0]);

    const components = message.components;
    const avatarURL = user.displayAvatarURL({ size: 64, dynamic: true });
    if (customId === 'checking') {
        embed.setFooter({
            text: `Checked by ${user.username}`,
            iconURL: avatarURL,
        })
            .setTimestamp()
            .setColor(4452719);
        const updatedComponents = components
            .map(row => {
                const updatedRow = row.components.filter(button => button.customId !== 'checking');
                if (updatedRow.length > 0)
                    return new ActionRowBuilder().addComponents(updatedRow);
                return null;
            })
            .filter(row => row !== null);
        await interaction.update({ embeds: [embed], components: updatedComponents });
    }else if(customId.startsWith('ignore-alt')){
        embed.setFooter({
            text: `Ignored by ${user.username}`,
            iconURL: avatarURL,
        })
            .setTimestamp()
            .setColor(5131854);
        const updatedComponents = components
            .map(row => {
                const updatedRow = row.components.filter(button => button.customId !== customId);
                if (updatedRow.length > 0)
                    return new ActionRowBuilder().addComponents(updatedRow);
                return null;
            })
            .filter(row => row !== null);

        const bmId = customId.split("-")[2];
        altCheck.ignoreList[bmId] = Date.now();
        return await interaction.update({ embeds: [embed], components: updatedComponents });

    } else if (customId.startsWith("remove")) {
        removedPushed(interaction, embed, avatarURL)
    } else if (customId.startsWith("show-more")) {
        showMorePushed(interaction, customId);
    } else if (customId.startsWith("alt-check-")){
        pageSwitchButtonPushed(interaction);
    }
});
async function showMorePushed(interaction, customId) {
    const bmId = customId.split("-")[2];
    if (!altCheck.playerData[bmId]) return await interaction.reply({ content: 'Something went wrong.', flags: 64 });
    
    showPlayerProfile(interaction, bmId)
}

async function removedPushed(interaction, embed, avatarURL) {
    const { customId, user, message } = interaction;
    const bmId = customId.split("-")[1];
    removePlayerFromTheWatchList(bmId);
    embed.setFooter({
        text: `Removed by ${user.username}`,
        iconURL: avatarURL,
    })
        .setTimestamp()
        .setColor(5131854);
    await interaction.update({ embeds: [embed], components: [] });
}

/**
 * @param {String} type - massReportAbusive | massReportCheating | susCheating
 * @param {Object} data - Object that contains the information needed for each Embed message.
 * 
 * massReportedAbusive: 
 *   - recentUniqueAbusiveReports: Number of Abusive report the player got in the last 24 hours.
 *   - name: name of the player
 *   - hours: number of hours the player has in Rust | -10 if Private
 *   - steamId: steamID of the player
 *   - bmId: battlemetricsID of the player
 *   - recentKills: number of kills in the last 24 hours
 *   - recentDeaths: number of deaths in the last 24 hours
 *   - recentKD: Kill / Death ratio in the last 24 hours
 * 
 * massReportedCheating
 *   - recentUniqueCheatReports: Number of Cheating report the player got in the last 24 hours.
 *   - name: name of the player
 *   - hours: number of hours the player has in Rust | -10 if Private
 *   - steamId: steamID of the player
 *   - bmId: battlemetricsID of the player
 *   - recentKills: number of kills in the last 24 hours
 *   - recentDeaths: number of deaths in the last 24 hours
 *   - recentKD: Kill / Death ratio in the last 24 hours
 * 
 * susCheating
 *   - recentUniqueCheatReports: Number of Cheating report the player got in the last 24 hours.
 *   - name: name of the player
 *   - hours: number of hours the player has in Rust | -10 if Private
 *   - steamId: steamID of the player
 *   - bmId: battlemetricsID of the player
 *   - recentKills: number of kills in the last 24 hours
 *   - recentDeaths: number of deaths in the last 24 hours
 *   - recentKD: Kill / Death ratio in the last 24 hours
 * 
 * watchListAlert:
 *   - name: name of the player
 *   - steamId: steamID of the player
 *   - bmId: battlemetricsID of the player
 *   - note: note attached to the player about why is he on the watchlist
 *   - adminName: name of the admin that placed him to the watchlist
 *   - adminAvatar: URL to the admin's discord avatar that placed him to the watchlist
 * 
 * possibleRgbAccountFound: 
 *   - name: name of the player
 *   - bmId: bmId of the player
 *   - numberOfPossibleAlts: number of game banned alts that was found
 */
export default async function sendAlert(type, data) {
    if (channel === null) return null;
    let content = ""
    if (type === "watchListAlert") {
        content = data.notify === "staff" ? `<@&${config.discord.staffRoleId}>` : `<@${data.notificationList.join("><@")}>`;
    } else
        content = core.notifications[type].length > 0 ? `<@${core.notifications[type].join("><@")}>` : "";

    const embed = getEmbed(type, data)
    const buttons = getButtons(type, data.bmId);

    await channel.send({ content: content, embeds: [embed], components: [buttons] });
}

try {
    client.login(config.discord.botAuthToken);
} catch (error) {
    logError(error.stack.toString());
    console.log(error);
    throw error;
}