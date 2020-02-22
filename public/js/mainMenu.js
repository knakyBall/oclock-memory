(() => {
    //A partir du moment qu'on est connecté à la socket, on peut commencer à échanger avec le serveur node
    jQuery(document).on('socketReady', () => {
        socket.emit('getScoreBoard', {}, (scoreboard) => {
            console.log(scoreboard)
            const $scoreBoardContainer = jQuery('.scoreboard .scoreboard-container');
            if (!scoreboard.success) {
                return $scoreBoardContainer.html(scoreboard.message);
            }

            let html = `<div class="aScore scoreHeader">
                            <div class="position">#</div>
                            <div class="pseudo">Pseudo</div>
                            <div class="time">Temps</div>
<!--                            <div class="nb_cards">Nb. Cartes</div>-->
<!--                            <div class="nb_try">Nb. Opérations</div>-->
                        </div>`;
            scoreboard.result.map((aResult, index) => {
                const diff = moment(aResult.finished_at).diff(moment(aResult.started_at));
                const duration = moment.utc(diff);

                html += `<div class="aScore">
                            <div class="position">${index + 1}</div>
                            <div class="pseudo">${aResult.pseudo.replace(/[\u00A0-\u9999<>\&]/gim, (i) => {return '&#'+i.charCodeAt(0)+';';
                })}</div>
                            <div class="time">${duration.format('mm:ss')}</div>
<!--                            <div class="nb_cards">${aResult.nb_cards}</div>-->
<!--                            <div class="nb_try">${aResult.nb_try}</div>-->
                        </div>`;
            });
            $scoreBoardContainer.html(html);
        });
    });
})();

