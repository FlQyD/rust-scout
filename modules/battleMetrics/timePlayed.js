export default async function timePlayed(playerId) {

    let resp;
    try {        
        resp = await fetch("https://api.battlemetrics.com/players/"+playerId+"?include=server");
        const data = await resp.json();
        const servers = data.included;
        
        const remaining = resp.headers.get("x-rate-limit-remaining");
        let extraTime = 0;
        if (remaining < 10) extraTime = 15000;
        else if (remaining < 30) extraTime = 3000;
        
        let timePlayed = 0;
        servers.forEach(server => {
            timePlayed += Number(server.meta.timePlayed);
        });
        return {timePlayed, extraTime};
    } catch (error) {
        if (resp.status === 404) return {timePlayed: "error", extraTime: 15000}; //Private Profile
        
        //Fetch failed
        console.error("ERROR PLAYERID: ",playerId, "\n",error);
        return {timePlayed: "error", extraTime: 60000};
    }
}