const config = {
    discord:{
        botAuthToken: "", //Discord Bot Token
        botApplicationId: "", //Application ID aka. Discord bot's client 
        guildId: "", //Discord server's id you want the BOT to work in
        channelId: "", //Designated channel for the BOT to dump the alerts and keep the interaction
        staffRoleId: "" //Staff's role ID, in case staff needs to be pinged
    },
    battleMetrics:{
        accessToken: "", //Battlemetrics API access token
        activityLinesRequested: 1000
    },
    steam: {
        apiKey: "" //Steam API key
    }
}

export default config;