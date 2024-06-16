const fs = require('node:fs');

let FULL_WORDS_DICT = [];
try {
    const data = fs.readFileSync('words_en.json', 'utf8');
    FULL_WORDS_DICT = JSON.parse(data).words;
} catch (err) {
    console.error(err);
}

WORDS_POOL = FULL_WORDS_DICT.slice();
const PLAYERS = [];

setupGame(5);

function setupGame(playerCount) {
    // Choose random word group in full list
    const rndIdx = getRandNum(0, WORDS_POOL.length);
    const wordGroup = WORDS_POOL[rndIdx];
    WORDS_POOL.splice(rndIdx, 1);

    // Pick main and alt word from group
    const mainWord = takeRandomFromPool(wordGroup);
    const altWord = takeRandomFromPool(wordGroup);

    // Create players
    for (let i = 0; i < playerCount; i++) {
        const player = {
            id: i + 1,
            name: getRandName(),
            role: undefined,
            word: undefined,
            points: 0
        }

        PLAYERS.push(player);
    }

    // Generate roles pool
    const rolesPool = generateRolesPool(playerCount);

    // Assign roles randomly
    for (const player of PLAYERS) {
        player.role = takeRandomFromPool(rolesPool);

        if (player.role === "civil") player.word = mainWord;
        if (player.role === "under") player.word = altWord;
        if (player.role === "white") player.word = "...";
    }

    showPlayersDebug(PLAYERS);

    console.log(`Civilians have '${mainWord}' and undercover have '${altWord}'`);
}

function getRandName() {
    const names = [ 
        'John',
        'Hugo',
        'Victor', 
        'Paul',
        'Kevin',
        'Marie',
        'Manon',
        'Marc',
        'Linus',
        'Bram',
        'Denis',
        'Bill',
        'Steve',
        'Alan',
        'Michael',
        'Fabienne'
    ];

    return names[getRandNum(0, names.length)];
}

function showPlayersDebug(players) {
    for (const player of players) {
        console.log(`${player.id}. ${player.name} [${player.role}]: ${player.word} (${player.points} pts)`);
    }
}

function takeRandomFromPool(pool) {
    if (pool.length == 0) throw Error("Cannot take from empty pool")

    const rndIdx = getRandNum(0, pool.length);
    return pool.splice(rndIdx, 1)[0];
}

function generateRolesPool(playerCount) {
    const combinations = [
        null, // 0
        null, // 1
        null, // 2
        { civil: 2, under: 1, white: 0 }, // 3
        { civil: 3, under: 1, white: 0 }, // 4
        { civil: 3, under: 1, white: 1 }, // 5
        { civil: 4, under: 1, white: 1 }, // 6
        { civil: 4, under: 2, white: 1 }, // 7
        { civil: 5, under: 2, white: 1 }, // 8
        { civil: 5, under: 3, white: 1 }, // 9
        { civil: 6, under: 3, white: 1 }, // 10
        { civil: 6, under: 3, white: 2 }, // 11
        { civil: 7, under: 3, white: 2 }, // 12
        { civil: 7, under: 4, white: 2 }, // 13
        { civil: 8, under: 4, white: 2 }, // 14
        { civil: 8, under: 5, white: 2 }, // 15
        { civil: 9, under: 5, white: 2 }, // 16
        { civil: 9, under: 5, white: 3 }, // 17
        { civil: 10, under: 5, white: 3 }, // 18
        { civil: 10, under: 6, white: 3 }, // 19
        { civil: 11, under: 6, white: 3 }, // 20
    ];

    if (playerCount < 3) throw Error('Cannot play with less than 3 players');
    if (playerCount > 20) throw Error('Cannot play with more than 20 players');

    const config = combinations[playerCount];
    const pool = [];

    for (let i = 0; i < config.civil; i++) pool.push("civil");
    for (let i = 0; i < config.under; i++) pool.push("under");
    for (let i = 0; i < config.white; i++) pool.push("white");

    return pool;
}

// max is excluded
function getRandNum(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
