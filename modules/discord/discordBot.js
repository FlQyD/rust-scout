import { Client, Events, GatewayIntentBits } from 'discord.js';
import { REST, Routes } from 'discord.js';
import { getTimeString, updateAlertNotifications } from '../../main.js';
import commands from "./commands.js"
import getButtons from './getButtons.js';
import getEmbed from './getEmbed.js';
import config from '../../config/config.js';
import watchListCommand from '../misc/watchListCommand.js';
import buttonPressed from './buttonPressed.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let channel = null;

client.once('ready', async () => {
    const guild = await client.guilds.fetch(config.discord.guildId);
    channel = await guild.channels.fetch(config.discord.channelId);

    const rest = new REST({ version: '10' }).setToken(config.discord.botAuthToken);
    await rest.put(Routes.applicationCommands(config.discord.botApplicationId), { body: commands });
    console.log(`${getTimeString()} | ${client.user.tag} logged in and found the channel with the ID: ${channel.id} | ${channel.name}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.commandName === "notify") return updateAlertNotifications(interaction);
    if (interaction.commandName === "watchlist") return watchListCommand(interaction);

    if (interaction.isButton()) return buttonPressed(interaction);

    console.error("Unhandled Interaction!\n"+interaction);
});

export async function sendAlert(content, alert, data) {
    try {
        const embed = getEmbed(data, alert)
        const buttons = getButtons(data, alert.embed.buttons)

        await channel.send({ content: content, embeds: [embed], components: [buttons] });
    } catch (error) {
        console.log(error);
        return false;
    }
    return true;
}

client.login(config.discord.botAuthToken);