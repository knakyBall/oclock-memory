let initialized = false;
jQuery(document).ready(() => {
    jQuery('#multi-player-url-input').val(document.location.href);
});
const initLobby = lobby_slug => {
    jQuery(document).on('socketReady', () => {
        jQuery('.lobby-playerlist').html(
            `<div class="pseudoForm">
            <h4>Quel est ton pseudo ?</h4>
            <div class="input-button">
                <input type="text" class="form-control" id="pseudo-input" value="${getCookie('saved_pseudo')}" />
                <button type="button" class="btn btn-primary" id="sendPseudo">Connexion</button>
            </div>
        </div>`
        );

        jQuery('#pseudo-input').on('keydown', function (e) {
            if (e.keyCode === 13) {
                return savePseudo();
            }
            if (!/^([a-zA-Z0-9-_])$/.test(e.key) && ![8, 16, 17, 18, 20, 37, 39, 46].includes(e.keyCode)){
                e.preventDefault();
            }
        });

        jQuery('#sendPseudo').on('click', function () {
            savePseudo();
        });
    });

    const savePseudo = () => {
        let pseudo = jQuery('#pseudo-input').val();
        setCookie('saved_pseudo', pseudo, 360);
        socketEmit('setPseudo', {pseudo}, (data) => {
            if (data.success) {
                return connectToLobby();
            } else alert(data.message);
        })
    }

    //Démarre la connexion au lobby
    const connectToLobby = () => {
        let isCreator = false;
        if (initialized) {
            return false;
        }
        initialized = true;
        //A partir du moment qu'on est connecté à la socket, on peut commencer à échanger avec le serveur node
        socketEmit('joinAGame', {lobby_slug}, (data) => {
            if (!data.success) {
                alert(data.message);
                document.location.href = '/';
            } else {
                isCreator = data.isCreator;
                refreshUI(data.gameConfig);
                socket.on('setGameConfiguration', refreshUI)
            }
        });


        const refreshUI = (config) => {
            //Génération du code HTML du créateur
            let creatorHTML = `
            <div class="creator-row">
                <h4>Créateur</h4>
                <div class="line-detail">
                    <div class="username">${config.creator.pseudo}</div>
                </div>
            </div>
        `;

            //Génération du code HTML du joueur
            let playersHTML = `<div class="players-row"><h4>Joueurs</h4>`;

            if (Object.keys(config.players).length) {
                Object.keys(config.players).map((player_session_id) => {
                    playersHTML += `<div class="line-detail">
                                    <div class="username">${config.players[player_session_id].pseudo}</div>
                                </div>`;
                });
            } else {
                playersHTML += `<div class="no-player">
                                Aucun joueur dans la partie
                            </div>`;
            }
            playersHTML += `</div>`;

            const $lobbyPlayerlist = jQuery('.lobby-playerlist');
            //Affichage du code
            let lobbyPlayerlistHTML = creatorHTML + playersHTML;

            $lobbyPlayerlist.html(lobbyPlayerlistHTML);

            const $lobbyCreatorDiv = jQuery('.lobby-creatorDiv');

            if (isCreator) {
                let creatorButtons = `<div class="lobby-creatorDiv">
                                    <button type="button" class="btn btn-primary mt-5" onclick="startGame()">
                                        Commencer à jouer
                                    </button>
                                </div>`;

                if (!$lobbyCreatorDiv.length) {
                    $lobbyPlayerlist.after(creatorButtons)
                } else {
                    $lobbyCreatorDiv.replaceWith(creatorButtons)
                }
            }
        };
    };
    //Démarre la partie avec les joueurs dans le lobby
    window.startGame = () => {
        socketEmit('startGame');
    };
};

