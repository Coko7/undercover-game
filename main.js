let gameDiv;

const WORDS_POOL = [
    ["Paris", "Marseille"],
    ["Cerise", "Fraise"],
    ["Yaourt", "Creme glace"],
];

let GAME_DATA = {
    state: undefined,
    round: undefined,
    playerCount: undefined,
    rolesConfig: undefined,
    players: [],
};

document.addEventListener("DOMContentLoaded", function() {
    gameDiv = document.getElementById("game");
    updatePlayerCount();
});

function startGame() {
    GAME_DATA.state = "play";
    const gamePlayPhase = document.querySelector("[phase='game-play']");
    const playerCards = gamePlayPhase.querySelector("#game-player-cards");
    playerCards.innerHTML = "";
    for (const player of GAME_DATA.players) {
        playerCards.appendChild(createPlayerCard(player));
    }

    const firstPlayer = pickFirstPlayer(GAME_DATA.players);
    for (const player of GAME_DATA.players) {
        let order = player.id - firstPlayer.id;
        if (order < 0) {
            order = GAME_DATA.players.length + order;
        }
        player.order = order;
        const playerCard = gamePlayPhase.querySelector(
            `#player-card-${player.id}`,
        );
        const orderDisplay = document.createElement("p");
        orderDisplay.innerHTML = player.order + 1;
        playerCard.appendChild(orderDisplay);
    }

    console.log(firstPlayer);
}

function pickFirstPlayer(players) {
    const playersAbleToStart = players.filter((player) =>
        player.role != "white"
    );

    const rndIdx = getRandNum(0, playersAbleToStart.length);
    const firstPlayer = playersAbleToStart[rndIdx];
    return firstPlayer;
}

function showPlayerCardDialog() {
}

function resetEverything() {
    GAME_DATA.state = "pre-setup";
    GAME_DATA.players = [];
    GAME_DATA.playerCount = undefined;
}

function setupGame() {
    GAME_DATA.state = "setup";
    if (WORDS_POOL.length == 0) {
        alert("NO MORE WORD!!!");
        return;
    }
    // Choose random word group in full list
    const rndIdx = getRandNum(0, WORDS_POOL.length);
    const wordGroup = WORDS_POOL[rndIdx];
    WORDS_POOL.splice(rndIdx, 1);

    // Pick main and alt word from group
    const mainWord = takeRandomFromPool(wordGroup);
    const altWord = takeRandomFromPool(wordGroup);

    // Create players
    GAME_DATA.players = [];
    for (let i = 0; i < GAME_DATA.playerCount; i++) {
        const player = {
            id: i,
            name: `Player ${i + 1}`,
            role: undefined,
            word: undefined,
            order: undefined,
            eliminated: false,
            points: 0,
        };

        GAME_DATA.players.push(player);
    }

    // Generate roles pool
    const rolesPool = generateRolesPool(GAME_DATA.playerCount);

    // Assign roles randomly
    for (const player of GAME_DATA.players) {
        player.role = takeRandomFromPool(rolesPool);

        if (player.role === "civil") player.word = mainWord;
        if (player.role === "under") player.word = altWord;
        if (player.role === "white") player.word = "...";
    }

    let playerCards = document.getElementById("setup-player-cards");
    playerCards.innerHTML = "";
    for (const player of GAME_DATA.players) {
        playerCards.appendChild(createPlayerCard(player));
    }
    showPlayersDebug(GAME_DATA.players);

    console.log(
        `Civilians have '${mainWord}' and undercover have '${altWord}'`,
    );
}

function votePlayer(player) {
    if (player.eliminated) {
        throw Error("Cannot vote an already eliminated player!");
    }

    player.eliminated = true;

    const alivePlayers = GAME_DATA.players.filter((player) =>
        player.eliminated === false
    );

    const aliveCivils = alivePlayers.filter((player) =>
        player.role === "civil"
    );

    const aliveUnders = alivePlayers.filter((player) =>
        player.role === "under"
    );

    const aliveWhites = alivePlayers.filter((player) =>
        player.role === "white"
    );

    if (player.role === "white") {
        // Allow to crack the secret word
        // TODO: IMPLEMENT GUESS LOGIC
        const guessedCorrectly = false;
        if (guessedCorrectly) {
            const winners = [];
            winners.push(player);
            // TODO: Do other Mr. Whites also win if alive and their peer guesses the word?
            // for (const aliveWhite of aliveWhites) {
            //     winners.push(aliveWhite);
            // }

            return endGame(2, winners);

            // END GAME. Mr White have won.
            // player.points += 6;
        }
    }

    if (aliveUnders.length === 0 && aliveWhites.length === 0) {
        // END GAME. Civils have won
        return endGame(0, aliveCivils);
    }

    if (alivePlayers.length === 1) {
        // END GAME. Civilians have lost.
        const winners = [];
        for (const alivePlayer of alivePlayers) {
            if (alivePlayer.role === "civil") continue;

            winners.push(alivePlayer);
            return endGame(1, winners);
        }
    }

    // Do logic to remove his card, etc
}

function endGame(scenarioId, winners) {
    if (scenarioId === 0) {
        for (const civilWinner of winners) {
            civilWinner.points += 2;
        }
    }

    if (scenarioId === 1) {
        for (const winner of winners) {
            if (winner.role === "under") winner.points += 10;
            if (winner.role === "white") winner.points += 6;
        }
    }

    if (scenarioId === 2) {
        for (const whiteWinner of winners) {
            whiteWinner.points += 6;
        }
    }

    // Display some stuff, etc
}

function showPlayersDebug(players) {
    for (const player of players) {
        console.log(
            `${player.id}. ${player.name} [${player.role}]: ${player.word} (${player.points} pts)`,
        );
    }
}

function updatePlayerCount() {
    const playerCount = document.getElementById("player-count").value;
    const playerCountSpan = document.getElementById("span-player-count");
    playerCountSpan.innerHTML = playerCount;

    const gameConfig = getGameConfig(playerCount);
    GAME_DATA.playerCount = playerCount;
    GAME_DATA.rolesConfig = gameConfig;

    const rolesPrevDiv = document.getElementById("roles-preview");
    rolesPrevDiv.innerHTML = "";

    if (gameConfig.civil > 0) {
        rolesPrevDiv.appendChild(
            createBadge("Civilians", gameConfig.civil, "role-civil"),
        );
    }
    if (gameConfig.under > 0) {
        rolesPrevDiv.appendChild(
            createBadge("Undercover", gameConfig.under, "role-under"),
        );
    }

    if (gameConfig.white > 0) {
        rolesPrevDiv.appendChild(
            createBadge("Mr. White", gameConfig.white, "role-white"),
        );
    }
}

function createPlayerCard(player) {
    let card = document.createElement("article");
    card.classList.add("player-card");
    card.classList.add(`role-${player.role}`);
    card.id = `player-card-${player.id}`;
    card.addEventListener("click", function() {
        alert(player.name);
    });

    let playerName = document.createElement("p");
    playerName.classList.add("player-name");
    playerName.innerHTML = player.name;
    card.appendChild(playerName);

    let playerRole = document.createElement("p");
    playerRole.classList.add("player-role");
    playerRole.innerHTML = player.role;
    card.appendChild(playerRole);

    let playerWord = document.createElement("p");
    playerWord.classList.add("player-word");
    playerWord.innerHTML = player.word;
    card.appendChild(playerWord);

    return card;
}

function createBadge(text, value, cssClass) {
    let badgeElem = document.createElement("div");
    badgeElem.classList.add("role-badge");
    badgeElem.classList.add(cssClass);

    let badgeTextElem = document.createElement("span");
    badgeTextElem.classList.add("badge-text");
    badgeTextElem.innerHTML = `${text}`;

    let badgeValElem = document.createElement("span");
    badgeValElem.classList.add("badge-val");
    badgeValElem.innerHTML = `${value}`;

    badgeElem.appendChild(badgeTextElem);
    badgeElem.appendChild(badgeValElem);

    return badgeElem;
}

function loadGameSetupPhase(gameWindow) {
}

function getGameConfig(playerCount) {
    if (playerCount < 3) throw Error("Cannot play with less than 3 players");
    if (playerCount > 20) throw Error("Cannot play with more than 20 players");

    const configs = [
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

    return configs[playerCount];
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

    if (playerCount < 3) throw Error("Cannot play with less than 3 players");
    if (playerCount > 20) throw Error("Cannot play with more than 20 players");

    console.log(playerCount);
    const config = combinations[playerCount];
    console.log(config);
    const pool = [];

    for (let i = 0; i < config.civil; i++) pool.push("civil");
    for (let i = 0; i < config.under; i++) pool.push("under");
    for (let i = 0; i < config.white; i++) pool.push("white");

    return pool;
}

function takeRandomFromPool(pool) {
    if (pool.length == 0) throw Error("Cannot take from empty pool");

    const rndIdx = getRandNum(0, pool.length);
    return pool.splice(rndIdx, 1)[0];
}

// max is excluded
function getRandNum(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
