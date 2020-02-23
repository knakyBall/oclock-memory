const logger = require('./config/logger');
const io = require("socket.io"),
    server = io.listen(8081);
const config = require('./config/index');

const sequelize = require('./config/sequelize');
const ScoreModel = require('./Model/Score');

sequelize
    .authenticate()
    .then(() => {
        logger.info('Connexion à la base de données OK');
    })
    .catch(err => {
        logger.error("Erreur de connexion à la base de données", err);
    });

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
    } catch (e) {
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
    if (playersList[socket.handshake.query.session_id] === undefined) {
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
    if (player.getPlayingGame()) {
        socket.emit('setGameConfiguration', player.getPlayingGame().getCurrentConfiguration());
    }

    socket.player = player;

    //Bind des events socket
    return bindSocketEvents(socket);
});

const bindSocketEvents = function (socket) {
    //Demande de création d'une nouvelle partie
    socket.on('createNewGame', (args) => {
        if (gamesList[socket.player.getSessionID()] === undefined || (gamesList[socket.player.getSessionID()] && gamesList[socket.player.getSessionID()].isStarted())) {
            gamesList[socket.player.getSessionID()] = new Game(server, socket.player);
        }
        socket.player.setPlayingGame(gamesList[socket.player.getSessionID()]);
        gamesList[socket.player.getSessionID()].goToLobby(socket.player)
    });

    //Demande de participation a une partie existante
    socket.on('joinAGame', ({lobby_slug}, cb) => {
        try {
            if (typeof cb !== "function") {
                logger.warn("Quelqu'un essaie de rejoindre sans callback");
            }
            else if (gamesList[lobby_slug] === undefined) {
                return cb({
                    success: false,
                    message: "Ce lobby n'existe pas"
                })
            } else if (gamesList[lobby_slug].isFinished()) {
                return cb({
                    success: false,
                    message: "La partie est déjà terminée"
                })
            } else if (gamesList[lobby_slug].isStarted()) {
                return cb({
                    success: false,
                    message: "La partie à déjà commencé"
                })
            }
            else if (socket.player.getSessionID() === lobby_slug){
                logger.verbose('[joinAGame]', 'Un créateur vient de rejoindre le lobby de sa propre partie');
                return cb({
                    success: true,
                    isCreator: true,
                    gameConfig: gamesList[lobby_slug].getCurrentConfiguration()
                });
            } else if (Object.keys(gamesList[lobby_slug].getPlayers()).length >= config.nbPlayerMax) {
                return cb({
                    success: false,
                    message: "Le nombre maximal de joueurs est atteint !"
                });
            }

            logger.verbose('[joinAGame]', 'Un joueur vient de rejoindre un lobby');

            socket.player.setPlayingGame(gamesList[lobby_slug]);
            gamesList[lobby_slug].addPlayer(socket.player);
            return cb({
                success: true,
                isCreator: false,
                gameConfig: gamesList[lobby_slug].getCurrentConfiguration()
            });
        }
        catch(e){
            return cb({
                success: false,
                message: e.message
            })
        }
    });

    //Demande de lancement d'une partie
    socket.on('startGame', (args) => {
        if (
            !gamesList[socket.player.getSessionID()] ||
            gamesList[socket.player.getSessionID()].isStarted() ||
            gamesList[socket.player.getSessionID()].getCreator().getSessionID() !== socket.player.getSessionID()
        ) {
            logger.warn('[startGame]', 'Impossible de démarrer la partie');
            return false;
        }
        gamesList[socket.player.getSessionID()].start();
    });

    //Demande de révéler une carte
    socket.on('compareCard', (args) => {
        if (gamesList[socket.player.getSessionID()] && gamesList[socket.player.getSessionID()].isFinished()) {
            return false;
        }
        if (args.card_index === undefined) {
            throw new Error(`Cet index de carte n'existe pas`);
        }
        logger.verbose(`[connection]`, `Comparaison de la carte ${args.card_index}`);
        gamesList[socket.player.getSessionID()].compareCard(args.card_index);
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

    socket.on('getScoreBoard', (args, cb) => {
        if (typeof cb !== "function") {
            logger.error('[getScoreBoard]', `Cette fonction ne possède pas de callback `)
            return false;
        }
        ScoreModel.findAll({
            order: sequelize.literal('TIMEDIFF(finished_at, started_at) ASC'),
            limit: 5
        }).then((result) => {
            return cb({
                success: true,
                result
            });
        }).catch((e) => {
            logger.error('[getScoreBoard]', e);
            return cb({
                success: false,
                message: e.message
            })
        })
    });
    //Demande d'enregistrement du score utilisateur
    socket.on('saveGameScore', (args, cb) => {
        if (!args.pseudo) {
            return cb({
                success: false,
                message: "Le pseudo n'est pas correct"
            });
        } else if (!gamesList[socket.player.getSessionID()]) {
            return cb({
                success: false,
                message: "Aucune session de jeu en cours"
            });
        } else if (!gamesList[socket.player.getSessionID()].isFinished()) {
            return cb({
                success: false,
                message: "La session de jeu n'est pas terminée"
            });
        }
        gamesList[socket.player.getSessionID()].saveScore(args.pseudo).then(() => {
            return cb({
                success: true
            });
        }).catch((e) => {
            return cb({
                success: false,
                message: e.message
            });
        })

    });

    //Récupére la configuration du jeu
    socket.on('getCurrentGameConfiguration', (args, cb) => {
        if (socket.player.getPlayingGame()) {
            cb({
                config: socket.player.getPlayingGame().getCurrentConfiguration()
            });
        } else {
            cb({
                config: null
            })
        }
    });
    //Déconnexion du client
    socket.on("disconnect", () => {
        logger.verbose(`[connection]`, `Déconnexion du client [id=${socket.player.getSocketID()}] [session_id=${socket.player.getSessionID()}]`);
        let playerPlayingGame = socket.player.getPlayingGame();

        if (playerPlayingGame && !playerPlayingGame.isCreator(socket.player) && !playerPlayingGame.isStarted()){
            playerPlayingGame.removePlayer(socket.player);
        }
        //Le client est toujours dans la liste, mais il est tagué comme déconnecté
        //TODO Le supprimer après un certain temps d'innactivité pour éviter de polluer la mémoire du serveur
        socket.player.setConnectionState(false);
    });
};