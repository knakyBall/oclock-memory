const config = require('../config');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const logger = require('../config/logger');
const moment = require('moment');

const ScoreModel = require('../Model/Score');

const Card = require('./Card');

/**  @typedef {(import(`./Player`))} Player **/

function Game(io, creator, nbCardMax = config.nbCardMaxDefault) {
    /** @type Object io **/
    this.io = io;
    /** @type ?moment started_at **/
    this.started_at = null;
    /** @type ?moment finished_at **/
    this.finished_at = null;
    /** @type Player creator **/
    this.creator = creator;
    /** @type number nbCardMax **/
    this.nbCardMax = (nbCardMax > config.nbCardMaxDefault) ? config.nbCardMaxDefault : ((nbCardMax <= 3) ? config.nbCardMaxDefault : nbCardMax);
    /** @type {Object.<string, Player>} players **/
    this.players = {};
    /** @type {Object.<string, Card[]>} players_cards **/
    this.players_cards = {};
    /** @type {Object.<string, Array.<number>>} comparing_cards **/
    this.comparing_players_cards = {};
    /** @type boolean score_saved **/
    this.score_saved = false;
    /** @type boolean score_saved **/
    this.time_reached = false;
    /** @type ?Player winner **/
    this.winner = false;

    this.addPlayer(creator);

    EventEmitter.call(this);
}

util.inherits(Game, EventEmitter);

Game.prototype.getGameConfig = function () {
    const playersConfig = {};
    Object.keys(this.players).map((playerSessionID) => {
        playersConfig[playerSessionID] = this.players[playerSessionID].toObject();
    });

    return {
        finished_at: this.finished_at,
        started_at: this.started_at,
        score_saved: this.score_saved,
        players_cards: this.players_cards,
        time_reached: this.time_reached,
        game_duration: config.game_duration,
        players: playersConfig,
        winner: this.winner ? this.winner.toObject() : null,
        creator: this.creator.toObject(),
    };
};

Game.prototype.goToLobby = function (player) {
    player.getSocket().emit('goToLobby', {lobby_slug: this.creator.getSessionID()});
};

Game.prototype.setCreator = function (creator) {
    this.creator = creator;
    this.addPlayer(creator);
};

//Génère une nouvelle configuration de jeu
Game.prototype.generateNewGameConfiguration = function () {
    if (this.finished_at) {
        return false;
    }
    logger.debug('[GAME]', `Génération d'une nouvelle configuration de jeu`);
    //Récupération d'un nombre max de cartes
    let availablesCard = [...config.available_fruits].splice(0, Math.round(this.nbCardMax / 2));
    let cards_keys = availablesCard.concat(availablesCard);

    Object.keys(this.players).map((player_session_id) => {
        cards_keys.sort(() => Math.random() - 0.5);
        let cards = [];
        cards_keys.map((card_key) => {
            try {
                cards.push(new Card(card_key));
            } catch (e) {
                logger.error('[GAME]', e);
            }
        });
        this.players_cards[player_session_id] = cards;
    });
};

//Récupère la configuration actuelle du jeu
Game.prototype.getCurrentConfiguration = function () {
    if (!this.isStarted()){
        return this.getGameConfig();
    }
    logger.debug('[GAME]', `Envoi de la configuration du jeu`);
    let players_cards = {};
    Object.keys(this.players_cards).map((player_session_id) => {
        players_cards[player_session_id] = [];
        this.players_cards[player_session_id].map((Card) => {
            players_cards[player_session_id].push(Card.toObject());
        });
    });
    return {...this.getGameConfig(), players_cards}
};

let compareCardTimeout = null;
//Déclanchée quand un joueur veut révéler une carte
Game.prototype.compareCard = function (card_index, player) {
    //Si la partie est finie on ne fait rien
    if (this.finished_at) {
        return false;
    }

    if (this.comparing_players_cards[player.getSessionID()] === undefined){
        this.comparing_players_cards[player.getSessionID()] = [];
    }

    //Si la carte existe bien
    if (this.players_cards[player.getSessionID()] && this.players_cards[player.getSessionID()][card_index]) {
        //Si la carte est déjà en train d'être comparée,
        //Ou si la carte est déjà découverte, on ne fait rien
        if (this.comparing_players_cards[player.getSessionID()].includes(card_index) || this.players_cards[player.getSessionID()][card_index].isRevealed()) {
            return false;
        }
        //Suppression du timeout de masquage des cartes si on affiche une autre carte
        if (compareCardTimeout) {
            clearTimeout(compareCardTimeout);
            compareCardTimeout = null;
        }
        if (this.comparing_players_cards[player.getSessionID()].length > 1) {
            //S'il y a déjà au moins 2 cartes dans le tableau de comparaison c'est qu'on essaie d'en comparer une de plus
            //Dans ce cas là on cache les précédentes carte comparées pour avoir un maximum de 2 cartes comparées en même temps
            let cardsToHide = [];
            this.comparing_players_cards[player.getSessionID()].map((comparing_card_index) => {
                this.players_cards[player.getSessionID()][comparing_card_index].setRevealState(false);
                cardsToHide.push({
                    player_session_id: player.getSessionID(),
                    card_index: comparing_card_index,
                    card: this.players_cards[player.getSessionID()][comparing_card_index].toObject()
                })
            });
            this.io.to(this.creator.getSessionID()).emit('hideCards', cardsToHide);
            this.comparing_players_cards[player.getSessionID()] = [];
        }
        //On ajoute la carte dans le tableau de comparaison
        this.comparing_players_cards[player.getSessionID()].push(card_index);

        //On révèle la carte
        this.players_cards[player.getSessionID()][card_index].setRevealState(true);
        //Puis on émit l'event pour révéler la carte au joueur
        this.io.to(this.creator.getSessionID()).emit('revealCards', [{
            player_session_id: player.getSessionID(),
            card_index,
            card: this.players_cards[player.getSessionID()][card_index].toObject()
        }]);

        //Si il y a une paire de cartes révélées, on démarre un timer pour les cacher au bout de "config.revelation_duration"
        if (this.comparing_players_cards[player.getSessionID()].length === 2) {
            //Si les cartes sont identiques, alors on les laisses révélées
            if (this.players_cards[player.getSessionID()][this.comparing_players_cards[player.getSessionID()][0]].getFruit() === this.players_cards[player.getSessionID()][this.comparing_players_cards[player.getSessionID()][1]].getFruit()) {
                logger.debug('[GAME]', `Paire découverte`);
                this.comparing_players_cards[player.getSessionID()] = [];

                //Vérification de toutes les cartes pour voir si il reste des cartes à découvrir
                let hasOneHiddenCard = false;
                this.players_cards[player.getSessionID()].map((card) => {
                    if (!card.isRevealed()) {
                        hasOneHiddenCard = true;
                    }
                });
                if (!hasOneHiddenCard) {
                    logger.debug('[GAME]', `${player.getPseudo()} à gagné la partie !`);
                    this.winner = player;
                    this.finish(false);
                }
            } else {
                //Démarrage du timeout
                compareCardTimeout = setTimeout(() => {
                    let cardsToHide = [];
                    this.comparing_players_cards[player.getSessionID()].map((comparing_card_index) => {
                        this.players_cards[player.getSessionID()][comparing_card_index].setRevealState(false);
                        cardsToHide.push({
                            player_session_id: player.getSessionID(),
                            card_index: comparing_card_index
                        })
                    });
                    this.io.to(this.creator.getSessionID()).emit('hideCards', cardsToHide);
                    this.comparing_players_cards[player.getSessionID()] = [];
                }, config.revelation_duration);
            }
        }
    } else throw new Error(`Cette carte n'existe pas`)
};

//Déclanchée en fin de partie pour révéler toutes les cartes
Game.prototype.revealAllCards = function () {
    Object.keys(this.players_cards).map((player_session_id) => {
        this.players_cards[player_session_id].map((Card) => {
            Card.setRevealState(true)
        });
    });
};

//Démarre le jeu et lance le timer
Game.prototype.start = function () {
    if (this.started) {
        this.stop();
    }
    logger.debug('[GAME]', `Démarrage du jeu`);
    this.started_at = moment();
    this.finished_at = null;
    this.winner = null;
    this.generateNewGameConfiguration();
    this.timeoutBeforeGameEnd = setTimeout(this.finish.bind(this, true), config.game_duration);
    this.io.to(this.creator.getSessionID()).emit('newGameStarted');
};

//Renvoie le creator du game
Game.prototype.getCreator = function () {
    return this.creator;
};

//Stoppe le jeu
Game.prototype.stop = function () {
    logger.debug('[GAME]', `Arret du jeu`);
    if (this.timeoutBeforeGameEnd) {
        clearTimeout(this.timeoutBeforeGameEnd);
        this.timeoutBeforeGameEnd = null;
    }
    this.started_at = null;
    this.finished_at = moment();
    this.winner = null;
    this.players_cards = [];
    Object.keys(this.players).map((player_session_id) => {
        this.players[player_session_id].getSocket().leave(this.creator.getSessionID());
    });
    this.players = {};
};


//Le jeu touche à sa fin suite au fait que toutes les paires soient trouvée
//ou que le timer ai pris fin
Game.prototype.finish = function (time_reached = false) {
    logger.debug('[GAME]', `Terminaison du jeu`);
    if (this.timeoutBeforeGameEnd) {
        clearTimeout(this.timeoutBeforeGameEnd);
        this.timeoutBeforeGameEnd = null;
    }

    this.time_reached = time_reached;
    this.finished_at = moment();
    this.revealAllCards();
    this.io.to(this.creator.getSessionID()).emit('gameFinished', this.getCurrentConfiguration());
    Object.keys(this.players).map((player_session_id) => {
        this.players[player_session_id].getSocket().leave(this.creator.getSessionID());
    });
};

Game.prototype.saveScore = function () {
    if (this.score_saved){
        return Promise.reject(new Error("Score déjà sauvegardé pour cette session"));
    }
    return ScoreModel
        .create({
            pseudo: this.winner.getPseudo(),
            started_at: this.started_at.format('HH:mm:ss'),
            finished_at: this.finished_at.format('HH:mm:ss'),
            nb_cards: this.nbCardMax,
            nb_try: 0 //TODO
        }).then((result) => {
            this.score_saved = true;
            return result;
        }).catch((e) => {
            logger.error('[GAME]', e);
            throw e;
        });
};

Game.prototype.isFinished = function () {
    return this.finished_at !== null;
};

Game.prototype.isStarted = function () {
    return this.started_at !== null;
};

Game.prototype.getSlug = function () {
    return this.creator.getSessionID();
};

/*************************************/
/**       Pistes d'amélioration     **/
/*************************************/

//Ajoute un joueur au tableau
Game.prototype.addPlayer = function (player) {
    if (this.started_at) {
        return false;
    }
    if(this.players[player.getSessionID()] !== undefined){
        throw new Error("Impossible d'ajouter ce joueur, il est déjà dans la partie");
    }
    this.players[player.getSessionID()] = player;
    this.players[player.getSessionID()].getSocket().join(this.creator.getSessionID());
    this.io.to(this.creator.getSessionID()).emit('playerHasJoined', player.toObject());
    this.io.to(this.creator.getSessionID()).emit('setGameConfiguration', this.getCurrentConfiguration());
};
//Supprime un joueur du tableau
Game.prototype.removePlayer = function (player) {
    if (!this.players[player.getSessionID()] || this.started_at) {
        return false;
    }
    this.players[player.getSessionID()].getSocket().leave(this.creator.getSessionID());
    delete this.players[player.getSessionID()];
    this.io.to(this.creator.getSessionID()).emit('playerHasLeaved', player.toObject());
    this.io.to(this.creator.getSessionID()).emit('setGameConfiguration', this.getCurrentConfiguration());
};

Game.prototype.isCreator = function (player){
    return this.creator.getSessionID() === player.getSessionID();
};
//Récupére la liste des joueurs
Game.prototype.getPlayers = function (player) {
    return this.players;
};

module.exports = Game;
