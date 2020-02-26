(() => {
    let initialized = false;

    //Initialisation du tableau de configuration
    let gameConfig = {
        finished_at: null,
        started_at: null,
        score_saved: false,
        time_reached: false,
        game_duration: null,
        winner: null,
        players_cards: []
    };

    // Initialisation de la variable qui contiendra l'intervalle de rafraichissement de la progressbar
    let progressBarInterval = null;

    //A partir du moment que la socket existe, on peut commencer à échanger avec le serveur node
    jQuery(document).on('socketReady', () => {
        // En cas de changement de la configuration de la partie
        // On synchronise la partie
        socket.on('setGameConfiguration', (config) => {
            setCurrentConfiguration(config);
        });

        // En cas de fin de temps impartit ou fin de partie normale ( toutes les cartes retournées )
        // On synchronise la partie
        socket.on('gameFinished', (config) => {
            console.log('%c Jeu terminé ! ', 'background: #222; color: #bada55');
            setCurrentConfiguration(config);
        });

        //Sur la réception de l'event permettant d'afficher une carte
        socket.on('revealCards', (revealedCards) => {
            // Pour chaque carte à révéler
            revealedCards.map(({player_session_id, card_index, card}) => {
                //On supprime la classe backed et on ajoute à la place la classe du fruit correspondant venant du serveur node
                const card_element = jQuery(`.player-workspace[data-player="${player_session_id}"] .cards-container .fruit-card[data-index=${card_index}]`);
                card_element.find('.fruit-card-image')
                    .removeClass('backed')
                    .addClass(card.fruit);
                // On stocke le nom du fruit dans ses data, pour savoir plus tard quelle classe détruire au moment
                // de cacher la carte
                card_element.data('fruit', card.fruit);
            });
        });

        //Sur la réception de l'event permettant de cacher une carte
        socket.on('hideCards', (hiddenCards) => {
            // Pour chaque carte à cacher
            hiddenCards.map(({player_session_id, card_index}) => {
                //On supprime la classe la classe de fruit correspondant précédemment stockée dans les data de l'élément
                const card_element = jQuery(`.player-workspace[data-player="${player_session_id}"] .cards-container .fruit-card[data-index=${card_index}]`);
                // Et on ajoute à la place la classe backed
                card_element.find('.fruit-card-image')
                    .removeClass(card_element.data('fruit'))
                    .addClass('backed');
                // Suppression du nom du fruit stocké précédemment
                card_element.data('fruit', null);
            });
        });

        // Dans certains cas on ne peut pas recevoir la configuration à la connexion au serveur
        // Donc au bout d'une seconde, si on ne l'a pas reçu, on la demande.
        setTimeout(() => {
            if (!initialized) {
                socketEmit('getCurrentGameConfiguration', {}, ({config}) => {
                    setCurrentConfiguration(config);
                });
            }
        }, 1000)
    });

    //Génération du code HTML des cartes
    const generateBackedCards = (cards_config) => {
        let html = '';
        //Pour chaques cartes
        cards_config.map((fruit_object, card_index) => {
            html += `
                 <div class="fruit-card" data-index="${card_index}">
                    <div class="fruit-card-image fruit ${fruit_object.fruit}"></div>
                 </div>`;
        });
        if (html === "") {
            html = `<h2>Aucune carte à afficher</h2>`
        }
        return html;
    };

    // Synchronisation de la configuration de la partie
    const setCurrentConfiguration = (config) => {
        // Récupération du session_id du client.
        let session_id = getCookie('PHPSESSID');
        initialized = true;
        gameConfig = config;

        // Si la config est null, c'est que la partie n'existe pas / plus
        // Peut arriver si on essaye d'accèder à une partie sans en avoir lancer une au préalable.
        // Dans ce cas la on redirige l'utilisateur, là ou il pourra en créer une.
        if (config === null) {
            document.location.href = '/';
            throw new Error('Aucun jeu en cours');
        }
        //Génération des cartes en HTML en fonction de la configuration de la session de jeu envoyée depuis le serveur socket
        let playersCardsHTML = ``;

        // Bloc de code permettant de réduire la taille de l'espace de chaque utilisateur
        // afin que toutes les cartes rentrent à l'écran
        //TODO Optimiser pour plus de 2 joueurs et pour 2 joueur et + sur mobile
        let workspace_scale = 1;
        const nbPlayers = Object.keys(config.players).length;
        if (nbPlayers === 2) {
            workspace_scale = 0.75;
        } else if (nbPlayers >= 3) {
            workspace_scale = 0.5;
        }

        //Pour chaque joueur on écrit les cartes
        Object.keys(config.players_cards).map((player_session_id) => {
            const cards = config.players_cards[player_session_id];
            playersCardsHTML += `<div class="player-workspace" data-player="${player_session_id}" style="transform: scale(${workspace_scale})">
                                    <h3>${config.players[player_session_id].pseudo}</h3>
                                    <div class="cards-container">
                                        ${generateBackedCards(cards)}
                                    </div>
                                </div>`;
        });

        // Puis on ajoute les cartes dans le DOM
        jQuery('.game-container').html(playersCardsHTML);

        setTimeout(() => {
            //Petit algorithme pour donner une rotation random pour l'esthetique
            jQuery('.cards-container .fruit-card').each(function () {
                let angle = Math.floor(Math.random() * 10) * (Math.round(Math.random()) ? 1 : -1);
                jQuery(this).css("transform", "rotate(" + angle + "deg)");
            })
        }, 50);


        //Gestion du clic sur une carte, uniquement pour le joueur présent
        jQuery('.player-workspace[data-player="' + session_id + '"] .cards-container .fruit-card').on('click', function () {
            if (gameConfig.finished) return false;
            if (!jQuery(this).find('.fruit-card-image').hasClass('backed')) return false;
            //Ici on va demander au serveur node quel est la carte qu'on vient de sélectionner
            let card_index = jQuery(this).data('index');
            socketEmit('compareCard', {card_index});
        });

        const $utilsContainer = jQuery('.utils-container');
        //Génération de la progress barre de timer
        if (config.started_at) {
            //Calcul de la date theorique de fin de la partie pour calculer le ratio
            const theoricEndDate = moment(config.started_at).add(config.game_duration, 'milliseconds');
            //Calcul du temps total de la partie pour calculer le ratio
            const totalTime = moment(theoricEndDate).diff(moment(config.started_at));

            //Si la progressebar n'existe pas encore, on la créé
            if (!$utilsContainer.find('.progress').length) {
                $utilsContainer.append(
                    `<div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>`
                );
            }
            //Si un interval est déjà en cours, on l'annule
            if (progressBarInterval) {
                clearInterval(progressBarInterval);
                progressBarInterval = null;
            }
            //Mise à jour de la progressbar
            progressBarInterval = setInterval(() => {
                let remainingTime = moment(theoricEndDate).diff(moment());
                let percentage = (remainingTime / totalTime) * 100;

                //Si le pourcentage est négatif ( temps dépassé ) on le laisse à 0
                if (percentage <= 0) {
                    percentage = 0;
                    if (progressBarInterval) {
                        clearInterval(progressBarInterval);
                        progressBarInterval = null;
                    }
                }

                //Mise à jour de la progressebar dans le dom
                $utilsContainer.find('.progress-bar').css('width', percentage + '%').attr('aria-valuenow', percentage);

            }, 500);
        }


        //Si la partie est fini a une heure qui n'est donc plus théorique
        if (config.finished_at !== null) {
            //Si un interval est déjà en cours, on l'annule
            if (progressBarInterval) {
                clearInterval(progressBarInterval);
                progressBarInterval = null;
            }
            //Calcul du ratio pour afficher la progressbar à jour
            const diff = moment(config.finished_at, 'HH:mm:ss').diff(moment(config.started_at, 'HH:mm:ss')) / 1000;
            const duration = moment.utc(Math.round(diff) * 1000);

            const totalTime = moment(config.started_at).add(config.game_duration, 'milliseconds').diff(moment(config.started_at));
            const remainingTime = moment(config.finished_at).diff(moment(config.started_at));
            const percentage = 100 - (remainingTime / totalTime) * 100;
            $utilsContainer.find('.progress-bar').css('width', percentage + '%').attr('aria-valuenow', percentage);

            //Construction des messages de fin
            let htmlResult = '';
            //Si la fin de partie a été provoquée par un temps dépassé
            if (gameConfig.time_reached) {
                htmlResult = `
                <div id="resultDiv">
                    <h2>
                        Mince ! Tu as perdu, tu n'a pas réussi à trouver toutes les paires dans le temps imparti. <br />
                        C'est vraiment trop bête ! Tu veux une glace ?<br /><br />
                        Ou peut-être retenter ta chance ?
                    </h2>
                    <div class="interactionDiv">
                        <button type="button" class="btn btn-primary mt-5" onclick="document.location.href='/'">Retourner au menu principal</button>
                    </div>
                </div>`;
            }
            //Si la fin de partie n'a pas été provoquée par un temps dépassé c'est qu'un joueur l'a terminée avant
            else {
                htmlResult = `
                <div id="resultDiv">
                    <h2>
                        Félicitations à ${config.winner.pseudo} qui a fini avec un score de 
                        <span class="highlight">${duration.format('m')} min</span> et 
                        <span class="highlight">${duration.format('s')} sec</span> !
                    </h2>
                    <div class="interactionDiv">`;
                if (config.winner.session_id === session_id) {
                    htmlResult += `
                        <button type="button" class="save-score-btn btn btn-primary mt-5" onclick="saveMyScore()">Enregistrer mon score</button>
                        <div class="spinner-border text-light" role="status" style="display: none">
                          <span class="sr-only">Veuillez patienter...</span>
                        </div>`;
                }
                htmlResult += `
                        <button type="button" class="btn btn-primary mt-5" onclick="document.location.href='/'">Retourner au menu principal</button>
                    </div>
                </div>`;
            }
            //Affichage du message avec le score
            const $resultDiv = jQuery('#resultDiv');
            if ($resultDiv.length) {
                $resultDiv.replaceWith(htmlResult);
            } else {
                jQuery('.main-container').append(htmlResult);
            }
            if (gameConfig.score_saved) {
                saveScoreSucceded();
            }
        }
    };

    //Fonction permettant de sauvegarder le score en base de données
    window.saveMyScore = function () {
        if (gameConfig.winner.session_id !== getCookie('PHPSESSID')){
            return false;
        }
        const $interractionDiv = jQuery('#resultDiv').find('.interactionDiv');
        const $button = $interractionDiv.find(".save-score-btn");
        const $spinner = $interractionDiv.find(".spinner-border");

        $button.hide();
        $spinner.fadeIn();
        socketEmit('saveGameScore', {}, (data) => {
            if (!data.success) {
                $button.show();
                $spinner.hide();
                alert(data.message);
            } else {
                saveScoreSucceded();
            }
        })
    };

    //Si le score a été sauvegardé avec succès, on affiche un message puis on met à dispo un bouton pour revenir au
    //menu principal
    const saveScoreSucceded = () => {
        const $interractionDiv = jQuery('#resultDiv').find('.interactionDiv');
        const $spinner = $interractionDiv.find(".spinner-border");

        $spinner.hide();
        $interractionDiv.html(`
            <h3>Ton score a été enregistré avec succès</h3>
            <button type="button" class="btn btn-primary mt-5" onclick="document.location.href='/'">Retourner au menu principal</button>
        `)
    }
})();

