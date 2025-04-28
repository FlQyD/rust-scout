import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default function getButtons(data, buttons) {    
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
    if (buttons.rgbShowMore) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`show-more-${data.bmId}`)
                .setLabel('Show more')
                .setStyle(ButtonStyle.Secondary),
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
    return actionRow;
}