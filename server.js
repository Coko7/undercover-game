/** Class representing the Game server. */
class GameServer {
    /**
     * Create a Game server.
     */
    constructor() {
        this.game = new Game();
    }
}

/** Represents a group of words related to one another */
class WordGroup {
    /**
     * Create a word group.
     * @param {string[]} words - An array of words.
     */
    constructor(words) {
        this.words = words;
    }
}

/** Class representing the words database. */
class WordsDatabase {
    /**
     * Get the full words list for the given language.
     * @param {string} language - The preferred language for the list of words.
     * @returns {WordGroup[]} - An array of word groups.
     */
    static getWordsList(language) {
        if (language !== "en") throw Error("Unsupported language: " + language);

        // TODO: read from file
        return [
            new WordGroup(["Paris", "Marseille"]),
        ];
    }
}

/** Class representing a game. */
class Game {
    /**
     * Create a game.
     * @param {string} language - The preferred language for text.
     * @param {number} playerCount - The number of players in the game.
     * @param {RolesConfig} rolesConfig - The configuration of roles for the game.
     */
    constructor(language, playerCount, rolesConfig) {
        this.language = language;
        this.playerCount = playerCount;
        this.players = [];
        this.rolesConfig = rolesConfig;
        this.rounds = [];
        this.wordsPool = WordsDatabase.getWordsList(language);
        this.roundIdSerial = 0;
    }

    /**
     * Get the preferred language for the game.
     * @returns {string} The preferred language.
     */
    getLanguage() {
        return this.language;
    }

    /**
     * Start the game.
     */
    start() {
        if (this.wordsPool.length === 0) {
            throw Error("Cannot start game because the wordsPool is empty!");
        }

        const round = new Round(this.roundIdSerial++);
        // Choose random word group in full list
        /** {WordGroup} */
        const wordGroup = CommonUtils.takeRandomFromPool(this.wordsPool);

        // Pick main and alt word from group
        /** {string} */
        const mainWord = CommonUtils.takeRandomFromPool(wordGroup);

        /** {string} */
        const altWord = CommonUtils.takeRandomFromPool(wordGroup);
    }
}

/** Class representing a game round. */
class Round {
    /**
     * Create a game round.
     * @param {number} id - The id of the round.
     */
    constructor(id) {
        this.id = id;
        this.secretWord = null;
        this.altWord = null;
        this.currentTurn = null;
        this.winners = [];
    }
}

/** Class representing a player. */
class Player {
    /**
     * Create a player.
     * @param {number} id - The player id.
     * @param {string} name - The name of the player.
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.role = null;
        this.word = null;
        this.order = null;
        this.isEliminated = false;
        this.points = 0;
    }

    /**
     * Set the role for the player.
     * @param {Role} role - The role value.
     */
    setRole(role) {
        this.role = role;
    }
}

/** Class representing a role. */
class Role {
    /**
     * Create a role.
     * @param {string} name - The name of the role.
     * @param {string} displayName - The display name of the role.
     * @param {number} winPoints - The number of points awarded to the player if they win.
     */
    constructor(name, displayName, winPoints) {
        this.name = name;
        this.displayName = displayName;
        this.winPoints = winPoints;
    }
}

/** Class representing a configuration of roles in the game. */
class RolesConfig {
    /**
     * Create a roles configuration.
     * @param {number} civiliansCount - The number of civilian players in the game.
     * @param {number} undercoversCount - The number of undercover players in the game.
     * @param {number} mrWhitesCount - The number of Mr. White players in the game.
     */
    constructor(civiliansCount, undercoversCount, mrWhitesCount) {
        this.civiliansCount = civiliansCount;
        this.undercoversCount = undercoversCount;
        this.mrWhitesCount = mrWhitesCount;
    }
}

class RolesConfigs {
    static Civilian = new Role("civilian", "Civilian", 2);
    static Undercover = new Role("undercover", "Undercover", 10);
    static MrWhite = new Role("mrWhite", "Mr. White", 6);

    static configs = [
        null, // 0
        null, // 1
        null, // 2
        new RolesConfig(2, 1, 0), // 3
        new RolesConfig(3, 1, 0), // 4
        new RolesConfig(3, 1, 1), // 5
        new RolesConfig(4, 1, 1), // 6
        new RolesConfig(4, 2, 1), // 7
        new RolesConfig(5, 2, 1), // 8
        new RolesConfig(5, 3, 1), // 9
        new RolesConfig(6, 3, 1), // 10
        new RolesConfig(6, 3, 2), // 11
        new RolesConfig(7, 3, 2), // 12
        new RolesConfig(7, 4, 2), // 13
        new RolesConfig(8, 4, 2), // 14
        new RolesConfig(8, 5, 2), // 15
        new RolesConfig(9, 5, 2), // 16
        new RolesConfig(9, 5, 3), // 17
        new RolesConfig(10, 5, 3), // 18
        new RolesConfig(10, 6, 3), // 19
        new RolesConfig(11, 6, 3), // 20
    ];

    /**
     * Get the roles config recommended for the given amount of players.
     * @param {number} playerCount - The amount of players in the game.
     * @return {RolesConfig} The recommended roles configuration to use.
     */
    static getRecommendedConfig(playerCount) {
        if (playerCount < 3) {
            throw Error("Cannot play with less than 3 players");
        }

        if (playerCount > 20) {
            throw Error("Cannot play with more than 20 players");
        }

        return configs[playerCount];
    }
}

/** Contains a collection of common utility functions. */
class CommonUtils {
    /**
     * Take a random element from a pool of elements and removes it from the pool.
     * @param {any[]} pool - A pool (array) of elements.
     * @returns {any} A randomly picked element.
     */
    static takeRandomFromPool(pool) {
        if (pool.length == 0) throw Error("Cannot take from empty pool");

        const rndIdx = CommonUtils.getRandNum(0, pool.length);
        return pool.splice(rndIdx, 1)[0];
    }

    /**
     * Get a random number between min (included) and max (excluded).
     * @param {number} min - The lower bound for possible number values.
     * @param {number} max - The upper bound for possible number values (excluded).
     * @returns {number} A random number.
     */
    static getRandNum(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
