jQuery(document).on('socketReady', () => {
    //A partir du moment qu'on est connecté à la socket, on peut commencer à échanger avec le serveur node
    socket.on('connect', () => {
        //On récupère la configuration de la session de jeu, au moment de la connexion au serveur
        socketEmit('getCurrentGameConfiguration', {}, ({config}) => {
            if (config === null) {
                document.location.href = '/';
                throw new Error('Aucun jeu en cours');
            }

            //Génération des cartes en HTML en fonction de la configuration de la session de jeu envoyée depuis le serveur socket
            let cardsHTML = generateBackedCards(config.cards);
            jQuery('.cards-container').html(cardsHTML);
            //Gestion du clic sur une carte
            jQuery('.cards-container .fruit-card').on('click', function () {
                //Ici on va demander au serveur node quel est la carte qu'on vient de sélectionner
                let card_index = jQuery(this).data('index');
                socketEmit('revealCard', {card_index});
            });
            setTimeout(() => {
                //Petit algorithme pour donner une rotation random pour l'esthetique
                jQuery('.cards-container .fruit-card').each(function () {
                    let angle = Math.floor(Math.random() * 10) * (Math.round(Math.random()) ? 1 : -1);
                    jQuery(this).css("transform", "rotate(" + angle + "deg)");
                })
            }, 50)
        });
    });

    //Sur la réception de l'event permettant d'afficher une carte
    socket.on('cardRevealed', ({card_index, card}) => {
        //On supprime la classe backed et on ajoute à la place la classe du fruit correspondant venant du serveur node
        const card_element = jQuery(`.cards-container .fruit-card[data-index=${card_index}]`);
        card_element.find('.fruit-card-image')
            .removeClass('backed')
            .addClass(card.fruit);
        card_element.data('fruit', card.fruit);
    });

    //Sur la réception de l'event permettant de cacher une carte
    socket.on('cardHidden', ({card_index, card}) => {
        //On supprime la classe la classe de fruit correspondant précédemment stockée dans les data de l'élément
        //et on ajoute à la place la classe backed
        const card_element = jQuery(`.cards-container .fruit-card[data-index=${card_index}]`);
        card_element.find('.fruit-card-image')
            .removeClass(card_element.data('fruit'))
            .addClass('backed');
        card_element.data('fruit', null);
    });
});

//Génération du code HTML des cards
const generateBackedCards = (cards_config) => {
    let html = '';
    cards_config.map((fruit_object, card_index) => {
        html += `<div class="fruit-card" data-index="${card_index}">
                    <div class="fruit-card-image fruit ${fruit_object.fruit}"></div>
                 </div>`;
    });
    if (html === "") {
        html = `<h2>Aucune carte à afficher</h2>`
    }
    return html;
};