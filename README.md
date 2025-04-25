# Silent Watcher
A Node.js application, that logs suspicious users based on BattleMetrics activity for rust servers.

## Notifications:
- MASS REPORTED - CHEATING: Alert sent to discord when a certain user gained 4+ cheating reports in the last 24 hours.
- MASS REPORTED - ABUSIVE: Alert sent to discord when a certain user gained 4+ abusive,spam reports in the last 24 hours
- SUS ALERT - CHEATING: Alert sent to discord when a certain user gained a higher than 6 K/D based on the activity in the last 24 hours.
- WATCHLIST ALERT: Alert send to the discord when a player from the watchlist joins the server. 
- RGB tracker: Possible rust game banned alt account was found

## Commands:
### `/notify`
Use this command to setup your notification preferences.
- **Options**:
  - `massReportedAbusive`: Decide if you wanna be notified when a `MASS REPORT - ABUSIVE` alert happens.  
  - `massReportedCheating`: Decide if you wanna be notified when a `MASS REPORT - CHEATING` alert happens.
  - `susCheating`: Decide if you wanna be notified when a `SUS ALERT - CHEATING` alert happens.
  - `rgbTracked`: Decide if you wanna be notified when a `RGB tracker` alert happens.

### `/watchlist`
Use this command to add or remove players from the watchlist. You will get notified when a specific player joins the server.

- **Usage**: `/watchlist <bm-id-or-steam-id> [note] [notify] [action]`
- **Options**:
  - `bm-id-or-steam-id`: BattleMetrics ID or Steam ID of the player you wanna add to the watchlist.
  - `note`: Add a note that will appear when the player joins the server, you can use it as a reminder why you placed the player into the watchlist.
  - `notify`: Choose notification settings for who should be notified when the player joins the server, only you or the whole staff team.    Deafult: only you.
  - `action`: Specify id you want to add or remove a player.    Default: add


## Config:
You need a discord BOT that you can generate at `https://discord.com/developers/applications`.
After you are done generating a discord application and a discord BOT as well for this, you can start fill out the `config.js`:
 - botAuthToken: You need a bot token, that can be used to authenticate as the BOT. This bot will send your notifications.
 - botApplicationId: You need your application's ID, this will be used for the commands built in the bot.
 - guildId: You need the ID of the guild where the bot will be active.
 - channelId: You need the channel in the guild where the bot can send the alerts, be aware command will be only work in this channel. Also the bot needs permission to send messages in this channel.

 You will need a BattleMetrics API Key, that has access to activity log, player identifiers, and has permission to use player queries. You can generate it at `https://www.battlemetrics.com/developers`:
   - accessToken: This is where the BattleMetrics API Key will need to be placed.
 
 You will also need a STEAM API Key, in order to access steam data about certain players: You can generate your own at `https://steamcommunity.com/dev/apikey`.
   - apiKey: This


## Start: 
 - `npm run start`: Start a pm2 process with the name "silentWatcher".