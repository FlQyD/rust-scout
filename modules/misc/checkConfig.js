import config from "../../config/config.js";
import { Client, GatewayIntentBits } from 'discord.js';

async function checkConfig() {
    await checkForCredentials();
    await checkDiscordBotAuthAndPrivileges();
    await checkBattlemetricsApiKey();
    if (config.steam.apiKey) await checkSteamApiKey();
}

async function checkForCredentials() {
    if (!config.discord) throw new Error("Missing Discord part of the config.");
    if (!config.discord.botAuthToken) throw new Error("Missing Discord BOT auth token.");

    if (!config.discord.botApplicationId) throw new Error("Missing Discord BOT application ID.");
    if (isNaN(Number(config.discord.botApplicationId))) throw new Error("Discord Application ID can only contain numbers!");

    if (!config.discord.guildId) throw new Error("Missing Discord Guild ID.");
    if (isNaN(Number(config.discord.guildId))) throw new Error("Discord Guild ID can only contain numbers!");

    if (!config.discord.channelId) throw new Error("Missing Discord Channel ID.");
    if (isNaN(Number(config.discord.channelId))) throw new Error("Discord Channel ID can only contain numbers!");

    if (!config.battleMetrics) throw new Error("Missing Battle Metrics part of the config.");
    if (!config.battleMetrics.accessToken) throw new Error("Missing Battle Metrics access token.");
    if (!config.battleMetrics.activityLinesRequested) {
        console.error("activityLinesRequest was missing from the config, it was set to 1000");
        config.battleMetrics.activityLinesRequested = 1000;
    }
    if (!config.steam || !config.steam.apiKey) {
        console.error("STEAM API KEY is missing from the config, there will be no friend check when scanning for banned ALT accounts.")
    }
}

async function checkDiscordBotAuthAndPrivileges(count = 0) {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    try {
        await client.login(config.discord.botAuthToken);
    } catch (error) {
        client.destroy();
        if (count >= 2) throw new Error(`DISCORD FATAL: ${error.message}`);

        console.error(`DISCORD ATTEMPT(${count + 1}): ${error.message}`);
        await new Promise(res => setTimeout(res, 5000));
        return await checkDiscordBotAuthAndPrivileges(count + 1);
    }

    client.once('ready', async () => {
        try {
            const guild = await client.guilds.fetch(config.discord.guildId);
            const channel = await guild.channels.fetch(config.discord.channelId);
            if (!channel) throw new Error("The Discord Bot cannot locate the channel.");

            const bot = await guild.members.fetch(client.user.id);
            const permissions = channel.permissionsFor(bot);

            if (!permissions.has('SendMessages')) throw new Error(`The Discord Bot is missing the permission to send messages to ${channel.name} | Channel ID: ${channel.id}`);
            if (!permissions.has('EmbedLinks')) throw new Error(`The Discord Bot is missing the permission to send embed messages to ${channel.name} | Channel ID: ${channel.id}`);
        } catch (error) {
            throw new Error(`DISCORD CHECK: ${error.message}`)
        } finally {
            client.destroy();
        }
    });
}

async function checkBattlemetricsApiKey() {
    try {
        const resp = await fetch(`https://api.battlemetrics.com/activity?version=^0.1.0&tagTypeMode=and&filter[types][whitelist]=rustLog:playerReport,rustLog:playerDeath:PVP,event:addPlayer&include=organization,user&page[size]=${config.battleMetrics.activityLinesRequested}&page[rel]=next&access_token=${config.battleMetrics.accessToken}`)
        const data = await resp.json()
    } catch (error) {
        throw new Error(`BATTLEMETRICS: Failed to load Activity: ${error.message}`);
    }
}

async function checkSteamApiKey() {
    try {
        const resp = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${config.steam.apiKey}&steamid=76561198345792209&relationship=friend`)
        if (resp.status !== 200) throw new Error(`Failed to fetch steam friends. HTTP Status: ${resp.status}`);
        const data = await resp.json();
    } catch (error) {
        throw new Error(`STEAM WEB API: ${error.message}`);
    }
}

export default checkConfig;