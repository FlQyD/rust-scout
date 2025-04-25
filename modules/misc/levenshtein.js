export function levenshteinStringComparison(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const distGrid = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
    const operations = Array.from({ length: len1 + 1 }, () =>
        Array(len2 + 1).fill(null)
    );

    for (let i = 0; i <= len1; i++) {
        distGrid[i][0] = i;
        operations[i][0] = 'delete';
    }
    for (let j = 0; j <= len2; j++) {
        distGrid[0][j] = j;
        operations[0][j] = 'insert';
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                distGrid[i][j] = distGrid[i - 1][j - 1];
                operations[i][j] = 'match';
            } else {
                const deletion = distGrid[i - 1][j] + 1;
                const insertion = distGrid[i][j - 1] + 1;
                const substitution = distGrid[i - 1][j - 1] + 1;

                distGrid[i][j] = Math.min(deletion, insertion, substitution);

                if (distGrid[i][j] === deletion) {
                    operations[i][j] = 'delete';
                } else if (distGrid[i][j] === insertion) {
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
        distance: distGrid[len1][len2],
        changes: changes.reverse(),
    };
}