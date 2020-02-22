const logger = require('./config/logger');
const io = require("socket.io"),
    server = io.listen(8123);

//Require des différentes classes
const Player = require('./Class/Player');
const Game = require('./Class/Game');


/** @type {Array.<Game>} gamesList **/
const gamesList = [];

/** @type {Object.<string, Player>} playersList **/
const playersList = {};

// Middleware de connexion utilisateur, le rejette si les paramètres de connexion obligatoires ne sont pas présents
server.use((socket, next) => {
    try {
        if (!socket.handshake.query.session_id) {
            return next(new Error("INVALID_SESSION_ID"));
        }
        return next();
    }
    catch(e) {
        logger.error(`[pre-connexion] `, e);
        return next(e);
    }
});

server.on('error', (e) => {
    logger.error(`[error] `, e);
});

server.on("connection", (socket) => {
    /** @type Player **/
    //Initialisation du joueur
    let player;

    //Si le client ne s'est encore jamais connecté
    if (playersList[socket.handshake.query.session_id] === undefined){
        //Alors on le créé
        player = new Player(socket.handshake.query.session_id);
        //Puis on l'ajoute à la liste des joueurs
        playersList[player.getSessionID()] = player;
        logger.verbose(`[connection]`, `Nouveau client [id=${socket.id}] [session_id=${player.getSessionID()}]`);
    }
    //S'il existe
    else {
        //Alors on le récupère de la liste
        player = playersList[socket.handshake.query.session_id];
        logger.verbose(`[connection]`, `Récupération client [id=${socket.id}] [session_id=${player.getSessionID()}]`);
    }
    //Puis on met à jour les données du joueur
    player.setSocket(socket);
    player.setConnectionState(true);

    //Si le joueur avait une partie en cours, on lui renvoie sa dernière configuration
    if (player.getPlayingGame()){
        socket.emit('setGameConfiguration', player.getPlayingGame().getCurrentConfiguration());
    }

    socket.player = player;

    //Bind des events socket
    return bindSocketEvents(socket);
});

const bindSocketEvents = function (socket) {
    //Demande de création d'une nouvelle partie
    socket.on('createNewGame', (args, cb) => {
        gamesList[socket.player.getSessionID()] = new Game(server, socket.player);
        socket.player.setPlayingGame(gamesList[socket.player.getSessionID()]);
        gamesList[socket.player.getSessionID()].start();
        cb({
            success: true
        });
    });

    //Demande de révéler une carte
    socket.on('revealCard', (args) => {
        if (args.card_index === undefined){
            throw new Error(`Cet index de carte n'existe pas`);
        }
        logger.verbose(`[connection]`, `Révélation de la carte ${args.card_index}`);
        gamesList[socket.player.getSessionID()].revealCard(args.card_index);
    });

    //Demande de suppression de la partie du joueur
    socket.on('stopGame', (args, cb) => {
        gamesList[socket.player.getSessionID()].stop();
        delete gamesList[socket.player.getSessionID()];
        socket.player.setPlayingGame(null);
        cb({
            success: true
        });
    });

    //Récupére la configuration du jeu
    socket.on('getCurrentGameConfiguration', (args, cb) => {
        if (socket.player.getPlayingGame()) {
            cb({
                config: socket.player.getPlayingGame().getCurrentConfiguration()
            });
        }
        else {
            cb({
                config: null
            })
        }
    });
    //Déconnexion du client
    socket.on("disconnect", () => {
        logger.verbose(`[connection]`, `Déconnexion du client [id=${socket.player.getSocketID()}] [session_id=${socket.player.getSessionID()}]`);
        //Le client est toujours dans la liste, mais il est tagué comme déconnecté
        //TODO Le supprimer après un certain temps d'innactivité pour éviter de polluer la mémoire du serveur
        socket.player.setConnectionState(false);
    });
};