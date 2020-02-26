/**  @typedef {(import(`./Game`))} Game **/

function Player(session_id) {
    /** @type ?string **/
    this.socket_id = null;
    /** @type string **/
    this.session_id = session_id;
    /** @type string **/
    this.pseudo = this.session_id;
    /** @type boolean **/
    this.connected = false;
    /** @type ?Game **/
    this.playingGame = null;
    /** @type Object **/
    this.socket = null;
}

//Change le pseudo du joueur
Player.prototype.setPseudo = function(pseudo){
    this.pseudo = pseudo;
};

//Récupère le pseudo du joueur
Player.prototype.getPseudo = function(){
    return this.pseudo;
};

//Défini le jeu auquel le joueur est en train de jouer
Player.prototype.setPlayingGame = function(game){
    this.playingGame = game;
};

//Renvoi le jeu auquel le joueur est en train de jouer
Player.prototype.getPlayingGame = function(){
    return this.playingGame;
};

//Renvoi le session_id du joueur
Player.prototype.getSessionID = function (){
    return this.session_id;
};

//Défini la socket du joueur
Player.prototype.setSocket = function (socket){
    this.socket = socket;
    this.socket_id = socket.id;
    this.socket.join(this.getSessionID());
    if (this.getPlayingGame()){
        this.socket.join(this.getPlayingGame().getCreator().getSessionID());
    }
};

//Renvoi le socket id du joueur
Player.prototype.getSocketID = function (){
    return this.socket_id;
};

//Défini l'état de connexion du joueur
Player.prototype.setConnectionState = function (connexion_state){
    this.connected = connexion_state;
};

//Renvoie l'état de connexion du joueur
Player.prototype.getConnectionState = function (){
    return this.connected;
};

//Défini la socket du joueur
Player.prototype.getSocket = function (){
    return this.socket;
};

//Permet d'exporter l'objet joueur proprement
Player.prototype.toObject = function () {
    return {
        socket_id: this.socket_id,
        session_id: this.session_id,
        connected: this.connected,
        pseudo: this.pseudo
    }
};

module.exports = Player;
