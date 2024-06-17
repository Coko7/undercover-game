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
        this.currentPhase = GamePhases.GameSetup;
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
        this.throwIfWrongPhase(GamePhases.GameSetup);

        this.players = [];
        for (let i = 0; i < this.playerCount; i++) {
            const player = new Player(0, `Player ${i + 1}`);
            this.players.push(player);
        }

        if (this.wordsPool.length === 0) {
            throw Error("Cannot start game because the wordsPool is empty!");
        }

        const round = new Round(this);
        this.rounds.push(round);
    }

    throwIfWrongPhase(expectedGamePhase) {
        if (this.currentPhase !== expectedGamePhase) {
            throw Error(
                `Expected ${expectedGamePhase} but got: ${this.currentPhase}`,
            );
        }
    }
}

const GamePhases = {
    GameSetup: 0,
    RoundSetup: 1,
    TurnPlaying: 2,
    TurnVotingStart: 3,
    TurnVotingContinue: 4,
    RoundEnded: 5,
};

/** Class representing a game round. */
class Round {
    /**
     * Create a game round.
     * @param {number} id - The id of the round.
     * @param {Game} game - The game this round belongs to.
     */
    constructor(id, game) {
        this.id = id;
        this.game = game;
        this.secretWord = null;
        this.altWord = null;
        this.currentTurn = null;
        this.winners = [];
        this.currentPhase = null;

        this.init();
    }

    hasEnded() {
        return winners.length > 0;
    }

    init() {
        // Choose random word group in full list
        /** {WordGroup} */
        const wordGroup = CommonUtils.takeRandomFromPool(this.game.wordsPool);

        // Pick main and alt word from group
        /** {string} */
        const mainWord = CommonUtils.takeRandomFromPool(wordGroup);

        /** {string} */
        const altWord = CommonUtils.takeRandomFromPool(wordGroup);

        // Generate roles pool
        const rolesPool = RolesConfigs.generateRolesPool(this.game.rolesConfig);

        // Assign roles randomly
        for (const player of this.game.players) {
            player.role = CommonUtils.takeRandomFromPool(rolesPool);

            if (player.isCivilian()) player.word = mainWord;
            if (player.isUndercover()) player.word = altWord;
            if (player.isMrWhite()) player.word = "";
        }

        this.currentPhase = GamePhases.RoundSetup;
    }

    /**
     * Start the round.
     */
    start() {
        this.game.throwIfWrongPhase(GamePhases.RoundSetup);

        this.currentPhase = GamePhases.RoundPlaying;
        const firstPlayer = this.pickFirstPlayer();

        for (const player of this.game.players) {
            let order = player.id - firstPlayer.id;
            if (order < 0) {
                order = this.game.players.length + order;
            }

            player.order = order;
        }

        this.game.currentPhase = GamePhases.TurnPlaying;
    }

    /**
     * Randomly picks the first player.
     * Players with the "Mr. White" role cannot start.
     * @returns {Player} The player who plays first.
     */
    pickFirstPlayer() {
        const playersAbleToStart = this.game.players.filter((player) =>
            player.role !== RolesConfigs.MrWhite
        );

        const rndIdx = CommonUtils.getRandNum(0, playersAbleToStart.length);
        const firstPlayer = playersAbleToStart[rndIdx];
        return firstPlayer;
    }

    voteMrWhite(mrWhiteToEliminate, guessWord) {
        this.game.throwIfWrongPhase(GamePhases.TurnVotingStart);
        this.game.currentPhase = GamePhases.TurnVotingContinue;

        if (guessWord === this.mainWord) {
            const winners = [];
            winners.push(mrWhiteToEliminate);
            // TODO: Do other Mr. Whites also win if alive and their peer guesses the word?
            // for (const aliveWhite of aliveWhites) {
            //     winners.push(aliveWhite);
            // }

            // TODO: EndGame
            return this.endGame(winners);

            // END GAME. Mr White have won.
            // player.points += 6;
        } else {
            this.voteContinue(mrWhiteToEliminate);
        }
    }

    voteStart(playerToEliminate) {
        this.game.throwIfWrongPhase(GamePhases.TurnPlaying);
        this.game.currentPhase = GamePhases.TurnVotingStart;

        if (playerToEliminate.isEliminated) {
            throw Error("Cannot vote out an already eliminated player!");
        }

        if (playerToEliminate.isMrWhite()) {
            return;
        }

        this.game.currentPhase = GamePhases.TurnVotingContinue;
        this.voteContinue(playerToEliminate);
    }

    voteContinue(playerToEliminate) {
        playerToEliminate.isEliminated = true;

        const alivePlayers = this.game.players.filter((p) =>
            p.isEliminated === false
        );

        const aliveCivils = alivePlayers.filter((p) => p.isCivilian());
        const aliveUnders = alivePlayers.filter((p) => p.isUndercover());
        const aliveWhites = alivePlayers.filter((p) => p.isMrWhite());

        if (aliveUnders.length === 0 && aliveWhites.length === 0) {
            // END GAME. Civils have won
            return this.endGame(aliveCivils);
        }

        if (alivePlayers.length === 1) {
            // END GAME. Civilians have lost.
            const winners = [];
            for (const alivePlayer of alivePlayers) {
                if (alivePlayer.isCivilian()) continue;

                winners.push(alivePlayer);
                return this.endGame(winners);
            }
        }
    }

    endGame(winners) {
        this.game.throwIfWrongPhase(GamePhases.TurnVotingContinue);
        for (const winner of winners) {
            winner.points += winner.role.winPoints;
        }
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

    /**
     * Check whether the player has the Civilian role.
     * @returns {boolean} true if the player is a civilian, false otherwise.
     */
    isCivilian() {
        return this.role === RolesConfigs.Civilian;
    }

    /**
     * Check whether the player has the Undercover role.
     * @returns {boolean} true if the player is an undercover, false otherwise.
     */
    isUndercover() {
        return this.role === RolesConfigs.Undercover;
    }

    /**
     * Check whether the player has the "Mr. White" role.
     * @returns {boolean} true if the player is Mr. White, false otherwise.
     */
    isMrWhite() {
        return this.role === RolesConfigs.MrWhite;
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

    /**
     * Generate the pool of roles used to randomly assign the players' team.
     * @param {RolesConfig} rolesConfig - The roles configuration to use.
     * @returns {Roles[]} A pool (array) of roles.
     */
    static generateRolesPool(rolesConfig) {
        /** {Role[]} The pool of roles */
        const pool = [];

        for (let i = 0; i < rolesConfig.civiliansCount; i++) {
            pool.push(this.Civilian);
        }

        for (let i = 0; i < rolesConfig.undercoversCount; i++) {
            pool.push(this.Undercover);
        }

        for (let i = 0; i < rolesConfig.mrWhitesCount; i++) {
            pool.push(this.MrWhite);
        }

        return pool;
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
