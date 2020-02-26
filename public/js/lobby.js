let initialized = false;
//Sert à pré-remplir l'input pour pouvoir utiliser le bouton "copier" plus tard
jQuery(document).ready(() => {
    jQuery('#multi-player-url-input').val(document.location.href);
});

//Cet fonction initialise le lobby
const initLobby = lobby_slug => {
    //A partir du moment qu'on est connecté à la socket, on peut commencer à échanger avec le serveur node
    jQuery(document).on('socketReady', () => {
        //A l'initialisation du lobby, on démarre avec un formulaire pour rentrer le pseudo du joueur
        jQuery('.lobby-playerlist').html(
            `<div class="pseudoForm">
                <h4>Quel est ton pseudo ?</h4>
                <div class="input-button">
                    <input type="text" class="form-control" id="pseudo-input" value="${getCookie('saved_pseudo')}" />
                    <button type="button" class="btn btn-primary" id="sendPseudo">Connexion</button>
                </div>
            </div>`
        );

        // Cette fonction permet de limiter les entrées clavier de
        // l'utilisateur pour éviter qu'il rentre un pseudo étrange
        // Note: Une seconde vérification du pseudo est faite côté serveur
        jQuery('#pseudo-input').on('keydown', function (e) {
            //Si l'utilisateur appuie sur la touche entrée, alors on enregistre son pseudo au serveur
            if (e.keyCode === 13) {
                return savePseudo();
            }
            if (!/^([a-zA-Z0-9-_])$/.test(e.key) && ![8, 16, 17, 18, 20, 37, 39, 46].includes(e.keyCode)){
                e.preventDefault();
            }
        });

        //Au click sur le bouton, on enregistre le pseudo au serveur
        jQuery('#sendPseudo').on('click', function () {
            savePseudo();
        });
    });

    // Fonction permettant d'enregistrer le pseudo de l'utilisateur en
    // cookie ( pour qu'il n'ait pas à le re-saisir à chaque fois ) puis
    // l'envoie au serveur
    const savePseudo = () => {
        let pseudo = jQuery('#pseudo-input').val();
        setCookie('saved_pseudo', pseudo, 360);
        socketEmit('setPseudo', {pseudo}, (data) => {
            if (data.success) {
                return connectToLobby();
            } else alert(data.message);
        })
    };

    //Démarre la connexion au lobby
    const connectToLobby = () => {
        //Sécurité pour éviter de bind 2 fois les évènements
        if (initialized) {
            return false;
        }
        let isCreator = false;
        initialized = true;

        // L'utilisateur rejoint la partie précédemment instanciée
        socketEmit('joinAGame', {lobby_slug}, (data) => {
            //Si une erreur vient, on l'affiche puis on redirige vers la page d'accueil
            if (!data.success) {
                alert(data.message);
                document.location.href = '/';
            } else {
                //Si tout se passe bien, on charge la liste des utilisateurs
                isCreator = data.isCreator;
                refreshUI(data.gameConfig);
                socket.on('setGameConfiguration', refreshUI)
            }
        });


        //Chargement de la liste des utilisateurs
        const refreshUI = (config) => {
            //Génération du code HTML de la ligne du créateur
            let creatorHTML = `
            <div class="creator-row">
                <h4>Créateur</h4>
                <div class="line-detail">
                    <div class="username">${config.creator.pseudo}</div>
                </div>
            </div>
        `;

            //Génération du code HTML des lignes de joueurs
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

            //Affichage du code
            const $lobbyPlayerlist = jQuery('.lobby-playerlist');
            let lobbyPlayerlistHTML = creatorHTML + playersHTML;

            $lobbyPlayerlist.html(lobbyPlayerlistHTML);

            const $lobbyCreatorDiv = jQuery('.lobby-creatorDiv');

            // Si l'utilisateur est le créateur de la partie, alors on affiche le bouton permettant de lancer le jeu
            // Note: Meme si un utilisateur non créateur trouve le moyen d'afficher ce bouton, il ne pourra pas lancer
            // la partie ( vérification coté serveur )
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

