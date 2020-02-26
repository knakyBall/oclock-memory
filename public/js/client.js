let socket = null;

//Instantiation du socket
const startSocketIOClient = (url, lobby_url, play_url) => {
    socket = io(url, {
        query: {
            session_id: getCookie('PHPSESSID')
        }
    });
    socket.on('connect', () => {
        // Envoie d'un event serverStatus au dom, afin de pouvoir faire un traitement la socket est connectée.
        // Note: Non utilisé dans cette app, mais pourrait l'être pour afficher l'état de connexion au serveur
        jQuery(document).trigger('serverStatus', {status: 'connected'});
    });
    socket.on('disconnect', () => {
        // Envoie d'un event serverStatus au dom, afin de pouvoir faire un traitement la socket est déconnectée.
        // Note: Non utilisé dans cette app, mais pourrait l'être pour afficher l'état de connexion au serveur
        jQuery(document).trigger('serverStatus', {status: 'disconnected'});
    });

    socket.on('error', (error_code) => {
        console.error(`Server error [CODE][${error_code}]`);
    });

    //Envoie d'un event au dom pour s'assurer que l'objet socket existe vraiment et n'est pas null
    jQuery(document).trigger('socketReady');

    // Si le serveur nous ordonne de rejoindre le lobby
    socket.on('goToLobby', ({lobby_slug}) => {
        // On navigue jusqu'a lobby
        document.location.href = lobby_url.replace('lobbyslug', lobby_slug);
    });

    // Si le serveur nous ordonne de rejoindre une partie qui démarre
    socket.on('newGameStarted', () => {
        // On navige jusqu'à la page de déroulement de la partie
        document.location.href = play_url;
    });
};

//Création d'une fonction d'emit au cas où on veuille toutes les surcharger d'un coups
const socketEmit = (event_name, event_args, event_feedback) => {
    return socket.emit(event_name, event_args, event_feedback);
};

//Démarre une nouvelle partie et redirige vers la page /play
const startNewGame = () => {
    socketEmit('createNewGame');
};