# Rust Scout
A Node.js application, that logs suspicious users based on BattleMetrics activity for rust servers.
## Alerts:
The project has two build in alerts: 
- `WATCHLIST ALERT`: Alert send to the discord when a player from the watchlist joins the server. 
- `RGB Tracker`: Possible rust game banned alt account was found
Upon those built in alerts, everyone can set their own desired alerts they would like to see in the `config/alertConfig.json`, you don't need to edit JSON in order to make your own alert you can go to `https://rust-scout.flqyd.dev` to generate your own config.
Every fresh instance has three default alerts that can be changed: `massReportedCheating`, `massReportedAbusive`, `susAlertCheating`
- `massReportedCheating` alert will be sent when a player receives more then 3 cheating report arrives for a player in the last 12 hours.
- `massReportedAbusive` alert will be sent when a player receives more then 3 abusive report arrives for a player in teh last 12 hours.
- `susAlertCheating` alert will be sent when a player gets a K/D higher then 6 and has less then 150 hours on his battlemetrics account.
## Creating your own alert: 
Custom alerts can be made at `https://rust-scout.flqyd.dev`, every alert will need a trigger which can include the following variables: 
- `recentKills` - Kill count from the last 12 hours
- `recentDeaths` - Death count from the last 12 hours
- `recentKd` - K/D based on kills/deaths from the last 12 hours
- `recentUniqueKills` - Distinct players killed in the last 12 hours
- `recentUniqueDeaths` - Distinct players deaths in the last 12 hours
- `recentCheatReports` - Number of cheat reports from the last 12 hours
- `recentAbusiveReports` - Number of abusive reports from the last 12 hours
- `recentUniqueCheatReports` - Number of distinct cheat reports received in the last 12 hours
- `recentUniqueAbusiveReports` - Number of distinct abusive reports received in the last 12 hours
You can chain multiple triggers, and they from an AND gate, which means the alert will only be sent once all the triggers happened.
## Commands:
### `/notify`
You can use this command to setup your notification preferences, if you wish to be notified when an alert fires up or not. It includes all of the custom alerts as well.
Also if you use the command on it's own without any parameters, it will show which notifications are you subscribed and which ones you aren't.
### `/watchlist`
Use this command to add or remove players from the watchlist. You will get notified when a specific player joins the server as long as you added them to the watchlist.
- **Usage**: `/watchlist <bm-id-or-steam-id> [note] [notify] [action]`
- **Options**:
  - `bm-id-or-steam-id`: BattleMetrics ID or Steam ID of the player you wanna add to the watchlist.
  - `note`: Add a note that will appear when the player joins the server, you can use it as a reminder why you placed the player into the watchlist.
  - `notify`: Choose notification settings for who should be notified when the player joins the server, only you or the whole staff team.    Default: only you.
  - `action`: Specify id you want to add or remove a player.    Default: add
## Installation and configuration:
1. You can download the code for the BOT from github directly: https://github.com/FlQyD/rust-scout
2. When you finished downloading the bot, you will need to be install the dependencies with the `npm install` command.
3. Before you could start the BOT, you will need to make sure that you fill out the `/config/config.js` file:
    - Discord: 
        - `botAuthToken`: Authentication token for the BOT that can be used to login to Discord.
        - `botApplicationId`: The ID of the BOT. 
        - `guildId`: The ID of the Discord server you want the bot to work in.
        - `channelId`: The ID of the Discord channel you want the bot to work in.
        - `staffRoleId`: The Staff role's ID, in case an alert would be fired that needs all the admins to know about it.
    - Battle Metrics:
        - `accessToken`: Access token for Battle Metrics that the BOT will use to request the Activity / Player's Data. If you don't want to include one of your servers to be watched, you can just remove it from the permissions from this ID.
        - `activityLinesRequested`: Number of activity log lines the bot should request, it cannot be more then 1000.
    - Steam: 
        - `apiKey`(optional): Steam API Key for the BOT that it can use to request steam friends, when he tries to connect accounts.
## Start: 
 - `npm run start`: Start a pm2 process with the name "rustScout".

![Rust scout](https://rust-scout.flqyd.dev/images/rust-scout-small.png)