let socket = null;

//Instantiation du socket
const startSocketIOClient = (url, lobby_url, play_url) => {
    socket = io(url, {
        query: {
            session_id: getCookie('PHPSESSID')
        }
    });
    socket.on('connect', () => {
        jQuery(document).trigger('socketConnected');
    });
    socket.on('error', (error_code) => {
        console.error(`Server error [CODE][${error_code}]`);
    });
    jQuery(document).trigger('socketReady');

    socket.on('goToLobby', ({lobby_slug}) => {
        document.location.href = lobby_url.replace('lobbyslug', lobby_slug);
    });

    socket.on('newGameStarted', () => {
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