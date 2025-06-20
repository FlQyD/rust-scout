import config from "../../config/config.js";

const ONE_DAY = 24 * 60 * 60 * 1000

const namesToIgnore = [
    ".",
    "..",
    "...",
    "123",
    "cheat",
    "?",
    "??",
    "???",
    ":)"
];

const commonNameParts = [
    "survivor (",
    "survivor",
    "kiosk",
    "banditcamp.com",
    "banditcamp",
    "rustchance.com",
    "rustchance",
    "rustypot.com",
    "rustypot",
    "rustclash.com",
    "rustclash",
    "cobaltlab.tech",
    "cobaltlab",
    "bloodrust",
    "beamer",
    "beam",
    "123",
    "rustypot",
    "thing ",
    "thing"
];

/**
 *
 * @param {Number} bmId - battlemetrics ID of the player
 * @returns {Object} - outcome {possibleAlts | main | alts}
 */
export async function altCheckProcess(bmId) {
    const possibleAlts = await getEACBannedConnections(bmId);
    if (possibleAlts === "error") return "error"

    let main = {};
    const altProfiles = [];
    for (let i = 0; i < possibleAlts.length; i++) {
        const alt = await buildProfile(possibleAlts[i], true)
        if (alt === "error") return "error";

        altProfiles.push(alt);
    }
    if (altProfiles.length > 0) {
        main = await buildProfile({ bmId });
        if (main === "error") return "error";
    }

    let outcome = {
        possibleAlts: 0,
        main: main,
        alts: altProfiles
    };
    outcome = calculateNewOutcome(outcome);
    return outcome;
}
function calculateNewOutcome(outcome) {
    const player = outcome.main;
    const alts = outcome.alts;

    const newOutcome = {}
    newOutcome.possibleAlts = 0;
    newOutcome.main = {};
    newOutcome.alts = [];

    alts.forEach(alt => {
        const similar = checkIfConnection(player, alt)

        if (similar.highestMatch <= 80 && similar.sameFriendCount == 0) return;

        newOutcome.possibleAlts = newOutcome.possibleAlts + 1;
        newOutcome.main = player;
        alt.highestMatch = similar.highestMatch;
        alt.sameFriendCount = similar.sameFriendCount;
        newOutcome.alts.push(alt);
    })

    if (newOutcome.possibleAlts == 0) return { possibleAlts: 0 }
    return newOutcome;
}

function checkIfConnection(player1, player2) {
    let sameFriendCount = 0;
    if (player1.friends.length > 0 && player2.friends.length > 0) {
        for (let i = 0; i < player1.friends.length; i++) {
            for (let j = 0; j < player2.friends.length; j++) {
                const friend1 = player1.friends[i];
                const friend2 = player2.friends[j];
                if (friend1 === friend2) sameFriendCount++;
            }
        }
    }
    let highestMatch = 0;
    for (let i = 0; i < player1.names.length; i++) {
        let name1 = removeCommonNameParts(player1.names[i]);
        if (!name1) continue;
        if (name1.length < 3) continue;
        if (isIgnoredName(name1)) continue;
        for (let j = 0; j < player2.names.length; j++) {
            const name2 = removeCommonNameParts(player2.names[j]);
            if (!name2) continue;
            if (name2.length < 3) continue;
            if (isIgnoredName(name2)) continue;

            const dif = levenshteinDistance(name1, name2)
            const distPerc = Math.floor((1 - (dif / Math.max(name1.length, name2.length))) * 100);
            if (distPerc > highestMatch) highestMatch = distPerc
        }
    }
    return { highestMatch, sameFriendCount };
}

async function getEACBannedConnections(bmId) {
    try {
        const queryBody = `{"data":{"type":"playerQuery","attributes":{"conditions":[{"types":["ip"],"scoreType":"score","score":1,"condition":{"and":[]}},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.lastBan","operator":"after","value":-31536000}]},"scoreType":"score","score":100},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.lastBan","operator":"after","value":-15552000}]},"scoreType":"score","score":100},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.lastBan","operator":"after","value":-7776000}]},"scoreType":"score","score":100},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.lastBan","operator":"after","value":-63072000}]},"scoreType":"score","score":100},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.banned","operator":"eq","value":false}]},"scoreType":"multiplier","score":0},{"types":["match"],"condition":{"and":[{"operand":"match.rustBans.banned","operator":"undef","value":true}]},"scoreType":"multiplier","score":0}]}}}`;
        const response = await fetch(`https://api.battlemetrics.com/players/${bmId}/relationships/player-query?include=player&page[size]=100`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${config.battleMetrics.accessToken}`,
                "Content-Type": "application/json"
            },
            body: queryBody
        });
        if (response.status !== 200) {
            await new Promise(r => { setTimeout(() => { r() }, 10000); })
            return getEACBannedConnections(bmId);
        }

        const data = await response.json();

        return data.included.map((item, index) => {
            if (item.attributes.private) return null;
            return {
                bmId: item.id,
                lastBan: new Date(getLastBan(item.id, data.data)).getTime()
            }
        }).filter(item => item !== null);
    } catch (error) {
        console.error("Error:", error);
        return "error";
    }
}
async function buildProfile({ bmId, lastBan }, alt = false, count = 0) {
    if (count > 2) return "error";
    try {
        const resp = await fetch(`https://api.battlemetrics.com/players/${bmId}?version=^0.1.0&include=identifier&access_token=${config.battleMetrics.accessToken}`); 
        if (resp.status == 429) throw new Error("Rate Limit");
        if (resp.status != 200) throw new Error(`Error while fetching ${bmId} to build profile. Status code: ${resp.status}`);
        if (Number(resp.headers.get("x-rate-limit-remaining")) < 150) await new Promise(r => { setTimeout(() => { r() }, 1000); })
        if (Number(resp.headers.get("x-rate-limit-remaining")) < 60) await new Promise(r => { setTimeout(() => { r() }, 10000); })
        if (Number(resp.headers.get("x-rate-limit-remaining")) < 30) await new Promise(r => { setTimeout(() => { r() }, 60000); })

        const bmData = await resp.json();

        const playerProfile = {};
        playerProfile.bmId = bmId;
        playerProfile.steamId = "unknown";
        if (alt) playerProfile.lastBan = lastBan;
        if (alt) playerProfile.daysSinceLastBan = Math.floor((Date.now() - lastBan) / ONE_DAY);
        playerProfile.bmAccountCreated = new Date(bmData.data.attributes.createdAt).getTime();

        playerProfile.names = [];
        if (alt) playerProfile.highestMatch = 0;
        playerProfile.friends = [];
        if (alt) playerProfile.sameFriendCount = 0;

        bmData.included.forEach((item) => {
            if (item.type != "identifier") return;

            if (item.attributes.type === "name") return playerProfile.names.push(item.attributes.identifier.trim());
            if (item.attributes.type === "steamID") return playerProfile.steamId = item.attributes.identifier;
        });

        if (playerProfile.steamId === "unknown") {
            const steamId = await getSteamId(bmId);
            playerProfile.steamId = steamId;
        }

        if (playerProfile.steamId != "unknown") {
            const currentFriendList = await getSteamFriends(playerProfile.steamId);
            playerProfile.friends = [...currentFriendList]

            const historicFriends = await getHistoricFriends(playerProfile.steamId);
            historicFriends.forEach(friend => {
                if (playerProfile.friends.includes(friend)) return;
                playerProfile.friends.push(friend)
            })
        }
        return playerProfile;
    } catch (error) {
        if (error.message === "Rate Limit") await new Promise(r => {setTimeout(() => {r()}, 60000);})
        console.error(`Build Profile Error: ${error}`);
        return buildProfile({bmId, lastBan}, alt, count+1);
    }
}

let lastSteamRateLimit = 0;
async function getSteamFriends(steamId) {
    if (!config.steam.apiKey) return [];
    if (Date.now() - lastSteamRateLimit < ONE_DAY) return [];

    const resp = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${config.steam.apiKey}&steamid=${steamId}&relationship=friend`)

    if (resp.status === 429) {
        lastSteamRateLimit = Date.now();
        return [];
    }
    if (resp.status === 200) {
        const data = await resp.json();
        return data.friendslist.friends.map(item => item.steamid);
    }
    return [];
}
async function getSteamId(bmId) {
    if (!config.flqydDev?.accessToken) return "unknown";
    try {
        const resp = await fetch(`https://rust-api.flqyd.dev/id/${bmId}?accessToken=${config.flqydDev.accessToken}`);
        if (resp.status !== 200) return "unknown";

        const data = await resp.json();
        if (!data.data || data.data.length == 0) return "unknown";
        return data.data[0].steamId;
    } catch (error) {
        console.error(error);
        return "unknown";
    }
}
async function getHistoricFriends(steamId) {
    if (!config.flqydDev?.accessToken) return [];
    try {
        const resp = await fetch(`https://rust-api.flqyd.dev/steamFriends/${steamId}?accessToken=${config.flqydDev.accessToken}`)
        if (resp.status != 200) return [];

        const data = await resp.json();
        if (!data.data | !data.data.friends) return [];
        return data.data.friends.map(item => item.steamId);
    } catch (error) {
        console.error(error);
        return [];
    }
}

function levenshteinDistance(str1, str2) {
    const distGrid = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) {
        for (let j = 0; j <= str2.length; j++) {
            if (i === 0) {
                distGrid[i][j] = j;
            } else if (j === 0) {
                distGrid[i][j] = i;
            } else {
                distGrid[i][j] = Math.min(
                    distGrid[i - 1][j] + 1,
                    distGrid[i][j - 1] + 1,
                    distGrid[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1)
                );
            }
        }
    }

    return distGrid[str1.length][str2.length];
}

function getLastBan(bmId, bmData) {
    for (const banItem of bmData) {
        if (banItem.id.split(":")[1] !== bmId) continue;
        return banItem.attributes.metadata.rustBans.lastBan;
    }
    return "NaN";
}

function removeCommonNameParts(name) {
    let lowerName = name.toLowerCase();

    commonNameParts.forEach(part => {
        let index;
        while ((index = lowerName.indexOf(part)) !== -1) {
            name = name.slice(0, index) + name.slice(index + part.length);
            lowerName = name.toLowerCase();
        }
    });

    return name.trim();
}

function isIgnoredName(name) {
    for (let i = 0; i < namesToIgnore.length; i++) {
        if (name.toLowerCase() === namesToIgnore[i].toLowerCase()) return true;
    }
    return false;
}