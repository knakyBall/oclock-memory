let socket = null;


//Instantiation du socket
const startSocketIOClient = (url) => {
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
};

//Création d'une fonction d'emit au cas où on veuille toutes les surcharger d'un coups
const socketEmit = (event_name, event_args, event_feedback) => {
    return socket.emit(event_name, event_args, event_feedback);
};

//Démarre une nouvelle partie et redirige vers la page /play
const startNewGame = (callback_url) => {
    socketEmit('createNewGame', {}, (data) => {
        if (data.success) {
            document.location.href = callback_url;
        }
        else console.error(data);
    })
};