let gameDiv;

let GAME_DATA = {
    playerCount: undefined,
    rolesConfig: undefined,
    players: [],
};

document.addEventListener("DOMContentLoaded", function() {
    gameDiv = document.getElementById("game");
    updatePlayerCount();
});

function startGame() {
    GAME_DATA.players = [];
    for (let i = 0; i < GAME_DATA.playerCount; i++) {
        const player = {
            id: i + 1,
            name: `Player ${i + 1}`,
            role: undefined,
            word: undefined,
            points: 0,
        };

        GAME_DATA.players.push(player);
    }

    var playerCards = document.getElementById("player-cards");
    playerCards.innerHTML = "";
    for (const player of GAME_DATA.players) {
        playerCards.appendChild(createPlayerCard(player));
    }

    console.log(GAME_DATA.players);
}

function updatePlayerCount() {
    const playerCount = document.getElementById("player-count").value;
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
    var card = document.createElement("article");
    card.classList.add("player-card");

    var playerName = document.createElement("p");
    playerName.innerHTML = player.name;
    card.appendChild(playerName);

    return card;
}

function createBadge(text, value, cssClass) {
    var badgeElem = document.createElement("div");
    badgeElem.classList.add("role-badge");
    badgeElem.classList.add(cssClass);

    var badgeTextElem = document.createElement("span");
    badgeTextElem.classList.add("badge-text");
    badgeTextElem.innerHTML = `${text}`;

    var badgeValElem = document.createElement("span");
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

    const config = combinations[playerCount];
    const pool = [];

    for (let i = 0; i < config.civil; i++) pool.push("civil");
    for (let i = 0; i < config.under; i++) pool.push("under");
    for (let i = 0; i < config.white; i++) pool.push("white");

    return pool;
}
