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

let mainChannel = null;

client.once('ready', async () => {
    const guild = await client.guilds.fetch(config.discord.guildId);
    mainChannel = await guild.channels.fetch(config.discord.channelId);

    const rest = new REST({ version: '10' }).setToken(config.discord.botAuthToken);
    await rest.put(Routes.applicationCommands(config.discord.botApplicationId), { body: commands });
    console.log(`${getTimeString()} | ${client.user.tag} logged in and found the channel with the ID: ${mainChannel.id} | ${mainChannel.name}`);
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

        const payload = {
            content, embeds: [embed],
            ...(buttons && { components: [buttons] })
        };

        //SEND MESSAGE
        if (alert.channel) {
            const guild = await client.guilds.fetch(config.discord.guildId);
            const channel = await guild.channels.fetch(alert.channel)
            await channel.send(payload);
        }else
            await mainChannel.send(payload);

    } catch (error) {
        console.log(error);
        return false;
    }
    return true;
}

setTimeout(() => {
    client.login(config.discord.botAuthToken);
}, 1000);