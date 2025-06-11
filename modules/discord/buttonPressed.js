import { ActionRowBuilder, EmbedBuilder } from "discord.js";
import { altCheck, getTimeString, removePlayerFromTheWatchList } from "../../main.js";
import { pageSwitchButtonPushed, showPlayerProfile } from "./altCheckEmbed.js";

/**
 * Module for all the common Button Pressed Events
 */

export default async function buttonPressed(interaction) {
    const customId = interaction.customId;

    if (customId === 'checking') return checkButtonPressed(interaction);
    if (customId.startsWith('ignore-alt')) return ignoreAltButtonPressed(interaction);
    if (customId.startsWith("remove")) return removedPressed(interaction)
    if (customId.startsWith("show-more")) return showMorePressed(interaction);
    if (customId.startsWith("alt-check-")) return pageSwitchButtonPushed(interaction);
}


async function checkButtonPressed(interaction) {
    const { user, message } = interaction;
    const components = message.components;
    const avatarURL = user.displayAvatarURL({ size: 64, dynamic: true });

    const embed = EmbedBuilder.from(message.embeds[0])
        .setFooter({
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
}
async function ignoreAltButtonPressed(interaction) {
    const { customId, user, message } = interaction;
    const components = message.components;
    const avatarURL = user.displayAvatarURL({ size: 64, dynamic: true });

    const embed = EmbedBuilder.from(message.embeds[0])
        .setFooter({
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

    await interaction.update({ embeds: [embed], components: updatedComponents });
}
async function removedPressed(interaction) {
    const { customId, user, message } = interaction;
    const bmId = customId.split("-")[1];

    removePlayerFromTheWatchList(bmId);

    const avatarURL = user.displayAvatarURL({ size: 64, dynamic: true });
    const embed = EmbedBuilder.from(message.embeds[0])
        .setFooter({
            text: `Removed by ${user.username}`,
            iconURL: avatarURL,
        })
        .setTimestamp()
        .setColor(5131854);

    await interaction.update({ embeds: [embed], components: [] });
}
async function showMorePressed(interaction) {
    const customId = interaction.customId;    
    const bmId = customId.split("-")[2];

    console.log(`${getTimeString()} | ${interaction.user.globalName}(${interaction.user.id}) requested alt data for ${bmId}`);

    if (!altCheck.playerData[bmId])
        return await interaction.reply({ content: 'Requested content has been deleted.', flags: 64 });

    showPlayerProfile(interaction, bmId)
}