const config = require('../config');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const logger = require('../config/logger');

const Card = require('./Card');

/**  @typedef {(import(`./Player`))} Player **/

function Game(io, creator) {
    /** @type Object started **/
    this.io = io;
    /** @type boolean started **/
    this.started = false;
    /** @type boolean finished **/
    this.finished = false;
    /** @type Player creator **/
    this.creator = creator;
    /** @type {Object.<string, Player>} players **/
    this.players = {};
    /** @type {Object.<{cards: Array<Card>}>} game_config **/
    this.game_config = {
        cards: []
    };

    EventEmitter.call(this);
}

util.inherits(Game, EventEmitter);

//Récupère la configuration actuelle du jeu
Game.prototype.getCurrentConfiguration = function (){
    logger.debug('[GAME]', `Récupération de la configuration du jeu`);
    let cards = this.game_config.cards;
    cards = cards.map((card) => {
        return card.toObject();
    });
    return {...this.game_config, cards}
};

//Déclanchée quand un joueur veut révéler une carte
Game.prototype.revealCard = function(card_index) {
    if (this.finished){
        return false;
    }
    if (this.game_config.cards[card_index]){
        setTimeout(() => {
            this.game_config.cards[card_index].setRevealState(false);
            this.io.to(this.creator.getSessionID()).emit('cardHidden', {card_index})
        }, config.revelation_duration);
        this.game_config.cards[card_index].setRevealState(true);
        this.io.in(this.creator.getSessionID()).emit('cardRevealed', {card_index, card: this.game_config.cards[card_index].toObject()});
    }
    else throw new Error(`Cette carte n'existe pas`)
};

//Démarre le jeu et lance le timer
Game.prototype.start = function() {
    logger.debug('[GAME]', `Démarrage du jeu`);
    this.started = true;
    this.finished = false;
    this.generateNewGameConfiguration();
    setTimeout(this.finish, config.game_duration)
};

//Génère une nouvelle configuration de jeu
Game.prototype.generateNewGameConfiguration = function() {
    if (this.finished){
        return false;
    }
    logger.debug('[GAME]', `Génération d'une nouvelle configuration de jeu`);
    let cards_keys = config.available_fruits.concat(config.available_fruits);
    cards_keys.sort(() => Math.random() - 0.5);
    let cards = [];
    cards_keys.map((card_key) => {
       cards.push(new Card(card_key));
    });
    this.game_config.cards = cards;
};

//Renvoie le creator du game
Game.prototype.getCreator = function(){
    return this.creator;
};

//Stoppe le jeu
Game.prototype.stop = function() {
    logger.debug('[GAME]', `Arret d'un jeu`);
    this.started = false;
    this.finished = true;
    this.players = {};
    this.game_config = {};
};


//Le jeu touche à sa fin suite au fait que toutes les paires soient trouvée
//ou que le timer ai pris fin
Game.prototype.finish = function() {
    logger.debug('[GAME]', `Jeu arrivé à la fin`);
    this.finished = true;
    this.io.in(this.creator.getSessionID()).emit('gameFinished', this.getCurrentConfiguration());
};

/*************************************/
/**       Pistes d'amélioration     **/
/*************************************/

//Ajoute un joueur au tableau
Game.prototype.addPlayer = function(player) {
    if (this.started){
        return false;
    }
    this.players[player.getSessionID()] = player;
    this.players[player.getSessionID()].getSocket().join(this.creator.getSessionID());
};
//Supprime un joueur du tableau
Game.prototype.removePlayer = function(player) {
    if (this.started){
        return false;
    }
    this.players[player.getSessionID()].getSocket().leave(this.creator.getSessionID());
    delete this.players[player.getSessionID()];
};

module.exports = Game;
