import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default function getButtons(type, bmId, data, alert) {
    if (data) return getCustomButtons(alert, data);
    if (type === "possibleRgbAccountFound") {
        return getShowMoreButton(bmId);
    }
    return getNormalButtons(type, bmId);
}

function getCustomButtons(alert, data) {
    const buttons = alert.embed.buttons;

    const actionRow = new ActionRowBuilder();
    if (buttons.check) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('checking')
                .setLabel('Checking')
                .setStyle(ButtonStyle.Success)
        );
    }
    if (buttons.watchlistRemove) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`remove-${data.bmId}`)
                .setLabel('Remove from watchlist')
                .setStyle(ButtonStyle.Danger)
        );
    }
    if (buttons.rgbIgnore) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`ignore-alt-${data.bmId}`)
                .setLabel('Ignore')
                .setStyle(ButtonStyle.Secondary)
        )
    }
    if (buttons.rhbShowMore) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`show-more-${bmId}`)
                .setLabel('Show more')
                .setStyle(ButtonStyle.Secondary),
        );
    }
    return actionRow;
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
                .setCustomId('remove-' + bmId)
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