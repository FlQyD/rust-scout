import config from "../../config.js"
const payload = `{"data":{"type":"playerQuery","attributes":{"conditions":[{"types":[],"scoreType":"score","score":1,"condition":{"and":[]}},{"types":[],"scoreType":"score","score":1,"condition":{"and":[]}},{"types":["ip"],"scoreType":"score","score":1,"condition":{"and":[]}},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.banned","operator":"eq","value":false}]},"scoreType":"multiplier","score":0}]}}}`

export default async function getIpLinkedGameBannedAlts(bmId) {
    try {
        
        let url = "https://api.battlemetrics.com/players/" + bmId + "/relationships/player-query?include=player,identifier,playerFlag,flagPlayer&filter[identifiers]=steamID,BEGUID,steamFamilyShareOwner,egsID,eosID,funcomID,playFabID,mcUUID,hllWindowsID,palworldUID,reforgerUUID&page[size]=100&page[offset]=0";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + config.battleMetrics.accessToken,
                "content-type": "application/json"
            },
            body: payload
        })
        const data = await response.json();
    } catch (error) {
        console.log(error);
        return "error"
    }
}