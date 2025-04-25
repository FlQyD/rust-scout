export default async function timePlayed(playerId) {

    let resp;
    try {        
        resp = await fetch("https://api.battlemetrics.com/players/"+playerId+"?include=server");    
        const data = await resp.json();
        const servers = response.included;
        let playTime = 0;
        
        const remaining = data.headers.get("x-rate-limit-remaining");
        let extraTime = 0;
        if (remaining < 10) {
            extraTime = 10000;
        }else if (remaining < 30) {
            extraTime = 3000;
        }
        
        servers.forEach(server => {
            playTime += Number(server.meta.timePlayed);
        });
        return {timePlayed: playTime, extraTime: extraTime};
    } catch (error) {
        if (resp.status === 200) return {timePlayed: "error", extraTime: 60000}; //Private Profile

        //Fetch failed
        console.error("ERROR PLAYERID: ",playerId, "\n",error);
        return {timePlayed: "error", extraTime: 60000};
    }
}