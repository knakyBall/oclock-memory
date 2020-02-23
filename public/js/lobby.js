let initialized = false;
const initLobby = lobby_slug => {
    let isCreator = false;
    if (initialized){
        return false;
    }
    initialized = true;
    //A partir du moment qu'on est connecté à la socket, on peut commencer à échanger avec le serveur node
    jQuery(document).on('socketReady', () => {
        socketEmit('joinAGame', {lobby_slug}, (data) => {
            if (!data.success){
                alert(data.message);
                document.location.href = '/';
            }
            else {
                isCreator = data.isCreator;
                refreshUI(data.gameConfig);
                socket.on('setGameConfiguration', refreshUI)
            }
        });

    });

    const refreshUI = (config) => {
        console.log("refreshUI", config);
        //Génération du code HTML du créateur
        let creatorHTML = `
            <div class="creator-row">
                <h4>Créateur</h4>
                <div class="line-detail">
                    <div class="username">${config.creator.session_id}</div>
                </div>
            </div>
        `;

        //Génération du code HTML du joueur
        let playersHTML = `<div class="players-row"><h4>Joueurs</h4>`;

        if ( Object.keys(config.players).length) {
            Object.keys(config.players).map((player_session_id) => {
                playersHTML += `<div class="line-detail">
                                    <div class="username">${config.players[player_session_id].session_id}</div>
                                </div>`;
            });
        }
        else {
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

        if (isCreator){
            let creatorButtons = `<div class="lobby-creatorDiv">
                                    <button type="button" class="btn btn-primary mt-5" onclick="startGame()">
                                        Commencer à jouer
                                    </button>
                                </div>`;

            if (!$lobbyCreatorDiv.length){
                $lobbyPlayerlist.after(creatorButtons)
            }
            else {
                $lobbyCreatorDiv.replaceWith(creatorButtons)
            }
        }
    };


    //Démarre la partie avec les joueurs dans le lobby
    window.startGame = () => {
        socketEmit('startGame');
    };
};

