(() => {
    //A partir du moment que la socket existe, on peut commencer à échanger avec le serveur node
    jQuery(document).on('socketReady', () => {
        // Demande du tableau des scores
        socket.emit('getScoreBoard', {}, (scoreboard) => {
            const $scoreBoardContainer = jQuery('.scoreboard .scoreboard-container');
            // En cas d'erreur, affichage de l'erreur à la place des scores
            if (!scoreboard.success) {
                return $scoreBoardContainer.html(scoreboard.message);
            }

            //Initialisation du code HTML avec le header du "tableau"
            let html = `<div class="aScore scoreHeader">
                            <div class="position">#</div>
                            <div class="pseudo">Pseudo</div>
                            <div class="time">Temps</div>
                        </div>`;

            // Boucle permettant d'ajouter les lignes de score
            scoreboard.result.map((aResult, index) => {
                const diff = moment(aResult.finished_at, 'HH:mm:ss').diff(moment(aResult.started_at, 'HH:mm:ss'));
                const duration = moment.utc(diff);

                html += `<div class="aScore">
                            <div class="position">${index + 1}</div>
                            <div class="pseudo">${aResult.pseudo.replace(/[\u00A0-\u9999<>\&]/gim, (i) => {return '&#'+i.charCodeAt(0)+';';})}</div>
                            <div class="time">${duration.format('mm:ss')}</div>
                        </div>`;
            });

            // Ecriture du code HTML dans le container
            $scoreBoardContainer.html(html);
        });
    });
})();

