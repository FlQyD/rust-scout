import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default function getButtons(type, bmId) {
    if (type === "possibleRgbAccountFound") {
        return getShowMoreButton(bmId);
    }
    return getNormalButtons(type, bmId);
}

function getNormalButtons(type, bmId) {
    const actionRow = new ActionRowBuilder();
    actionRow.addComponents(
        new ButtonBuilder()
            .setCustomId('checking')
            .setLabel('Checking')
            .setStyle(ButtonStyle.Success)
    );
    if (type === 'watchListAlert') {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('remove-'+bmId)
                .setLabel('Remove from watchlist')
                .setStyle(ButtonStyle.Danger)
        );
    }
    return actionRow;
}
function getShowMoreButton(bmId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`show-more-${bmId}`)
            .setLabel('Show more')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`ignore-alt-${bmId}`)
            .setLabel('Ignore')
            .setStyle(ButtonStyle.Secondary)
    );
}