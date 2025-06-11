import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } from 'discord.js';
import { altCheck } from '../../main.js';


export function showPlayerProfile(interaction, bmId) {
    const outcome = altCheck.playerData[bmId];
    if (outcome.possibleAlts == 0) return interaction.reply({ content: "Nothing connected to this account", flags: 64 });

    const data = getEmbedData(outcome, 0);

    interaction.reply({ content: "", embeds: [getEmbed(data)], components: [getButtons(outcome, 0)], flags: 64 })
}
export async function pageSwitchButtonPushed(interaction) {
    const customId = interaction.customId;
    const bmId = customId.split("-")[3];

    const outcome = altCheck.playerData[bmId];

    const index = Number(customId.split("-")[4]);

    const data = getEmbedData(outcome, index)
    const newEmbed = getEmbed(data);
    const newButtons = getButtons(outcome, index);

    await interaction.update({ embeds: [newEmbed], components: [newButtons], flags: 64 });
}
function getEmbedData(outcome, index) {
    const data = {};
    data.mainName = outcome.main.names[0];
    data.mainBmId = outcome.main.bmId;
    data.mainSteamId = outcome.main.steamId;
    data.mainAccountAge = outcome.main.bmAccountCreated;
    data.altsCount = outcome.alts.length
    data.altIndex = index;
    data.altName = outcome.alts[index].names[0];
    data.altBmId = outcome.alts[index].bmId;
    data.altSteamId = outcome.alts[index].steamId;
    data.altLastBan = outcome.alts[index].daysSinceLastBan;
    data.altAccountAge = outcome.alts[index].bmAccountCreated;
    data.sameFriends = getSameItems(outcome.main.friends, outcome.alts[index].friends);
    data.topNameMatches = getTopNameMatches(outcome.main.names, outcome.alts[index].names);
    return data;
}
function getEmbed(data) {
    return new EmbedBuilder()
        .setTitle(`Account ${data.altIndex + 1}/${data.altsCount} (${data.altName})`)
        .setDescription(
            "```" +
            `---- MAIN ----
name:        ${data.mainName}
bmID:        ${data.mainBmId}
steamID:     ${data.mainSteamId}
account age: ${getTimeString(data.mainAccountAge)}

----- POSSIBLE ALT ----
name:         ${data.altName}
bmID:         ${data.altBmId}
steamID:      ${data.altSteamId}
account age:  ${getTimeString(data.altAccountAge)}
banned since: ${data.altLastBan} days
same friends: ${data.sameFriends.length}
name match:   ${data.topNameMatches[0].percentage}%
` +
            "```"
        )
        .setURL(`https://www.battlemetrics.com/rcon/players/${data.altBmId}`)
        .setColor(16726843)
        .setAuthor({ name: `Alt Check - ${data.mainName}`, url: `https://www.battlemetrics.com/rcon/players/${data.mainBmId}` })
        .addFields(
            {
                name: `Same friends (${data.sameFriends.length}):`,
                value: `${data.sameFriends.map(item => ` - ${item}`).join("\n")} `
            },
            ...data.topNameMatches.map(item => {
                const itemNameStyled = getColoredNames(item);
                return {
                    name: `Name distance: ${item.percentage}%`,
                    value: `\`\`\`ansi\n${itemNameStyled.str1} | ${item.original.str1}
${itemNameStyled.str2} | ${item.original.str2}\`\`\``,
                    inline: false
                }
            })

        );
}
function getButtons(outcome, index) {
    const isThereMoreHigher = outcome.alts.length > (index + 1);
    const isThereMoreLower = index < 1;

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`alt-check-prev-${outcome.main.bmId}-${index - 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("◀️")
            .setDisabled(isThereMoreLower),
        new ButtonBuilder()
            .setCustomId(`alt-check-next-${outcome.main.bmId}-${index + 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("▶️")
            .setDisabled(!isThereMoreHigher)
    );
}
function getTopNameMatches(names1, names2) {
    const names = [];

    for (let i = 0; i < names1.length; i++) {
        const nameRow = [];
        const name1 = names1[i];
        for (let j = 0; j < names2.length; j++) {
            const name2 = names2[j];
            const obj = levenshteinStringComparison(name1, name2);
            nameRow.push(obj);
        }
        names.push(nameRow);
    }

    let indexedValues = names.flatMap((innerNames, rowIndex) =>
        innerNames.map((item, colIndex) => ({
            value: Math.floor((1 - (item.distance / Math.max(item.original.str1.length, item.original.str2.length))) * 100),
            rowIndex,
            colIndex
        }))
    );

    let top3 = indexedValues.sort((a, b) => b.value - a.value).slice(0, 5);
    let top3Items = top3.map(({ rowIndex, colIndex }) => names[rowIndex][colIndex]);
    return top3Items.map(item => {
        return {
            original: {
                str1: item.original.str1,
                str2: item.original.str2
            },
            percentage: Math.floor((1 - (item.distance / Math.max(item.original.str1.length, item.original.str2.length))) * 100),
            changes: item.changes
        }
    })
}
function getSameItems(arr1, arr2) {
    const sameArr = [];
    for (let i = 0; i < arr1.length; i++) {
        const item1 = arr1[i];
        for (let j = 0; j < arr2.length; j++) {
            const item2 = arr2[j];
            if (item1 == item2) {
                sameArr.push(item1);
                break;
            }
        }
    }
    return sameArr;
}
function levenshteinStringComparison(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
    const operations = Array.from({ length: len1 + 1 }, () =>
        Array(len2 + 1).fill(null)
    );

    for (let i = 0; i <= len1; i++) {
        dp[i][0] = i;
        operations[i][0] = 'delete';
    }
    for (let j = 0; j <= len2; j++) {
        dp[0][j] = j;
        operations[0][j] = 'insert';
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
                operations[i][j] = 'match';
            } else {
                const deletion = dp[i - 1][j] + 1;
                const insertion = dp[i][j - 1] + 1;
                const substitution = dp[i - 1][j - 1] + 1;

                dp[i][j] = Math.min(deletion, insertion, substitution);

                if (dp[i][j] === deletion) {
                    operations[i][j] = 'delete';
                } else if (dp[i][j] === insertion) {
                    operations[i][j] = 'insert';
                } else {
                    operations[i][j] = 'substitute';
                }
            }
        }
    }

    let i = len1,
        j = len2;
    const changes = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && operations[i][j] === 'match') {
            changes.push({ char1: str1[i - 1], char2: str2[j - 1], op: 'match' });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || operations[i][j] === 'insert')) {
            changes.push({ char1: ' ', char2: str2[j - 1], op: 'insert' });
            j--;
        } else if (i > 0 && (j === 0 || operations[i][j] === 'delete')) {
            changes.push({ char1: str1[i - 1], char2: ' ', op: 'delete' });
            i--;
        } else {
            changes.push({ char1: str1[i - 1], char2: str2[j - 1], op: 'substitute' });
            i--;
            j--;
        }
    }

    return {
        original: {
            str1: str1,
            str2: str2
        },
        distance: dp[len1][len2],
        changes: changes.reverse(),
    };
}

// [1;2m - bold
// [2;36m - blue
// [2;33m - gold
// [2;31m - red
// [0m - defaulting
function getColoredNames(obj) {
    let str1Styled = '';
    let str2Styled = '';

    let prevOp = null;
    let section1 = "";
    let section2 = "";
    obj.changes.forEach(({ char1, char2, op }) => {
        if (prevOp != null && prevOp != op) {
            str1Styled += getColoredSection(section1, prevOp);
            str2Styled += getColoredSection(section2, prevOp);
            section1 = "";
            section2 = "";
        }
        prevOp = op;
        section1 += char1;
        section2 += char2;
    });
    str1Styled += getColoredSection(section1, prevOp);
    str2Styled += getColoredSection(section2, prevOp);    

    return {
        str1: str1Styled,
        str2: str2Styled
    }
}
function getColoredSection(section, operation) {
    if (operation === 'match') {
        return `[1;2m[2;36m${section}[0m`;
    } else if (operation === 'substitute') {
        return `[1;2m[2;33m${section}[0m`;
    } else if (operation === 'delete' || operation === 'insert') {
        return `[1;2m[2;31m${section}[0m`;
    }
}

const ONE_DAY = 24 * 60 * 60 * 1000;
function getTimeString(timestamp) {
    let timeString = ""

    timeString += new Date(timestamp).toLocaleString().split(",")[0];
    timeString += ` (${Math.floor((Date.now() - timestamp) / ONE_DAY)} days)`

    return timeString;
}