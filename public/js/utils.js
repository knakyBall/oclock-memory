//Fonction permettant de récupérer la valeur d'un cookie
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//Fonction permettant de créer/modifier un cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

//Fonction permettant de copier la value d'une textfield dans le presse papier de l'utilisateur
function copyFromElement($buttonElement, elementID) {
    /* Récupère le textField */
    let copyText = document.getElementById(elementID);

    /* Sélectionne le textField */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*Pour les téléphones mobiles*/

    /* Copie le texte du textField */
    document.execCommand("copy");

    /* Affiche que le texte a été copié */
    if ($buttonElement.length) {
        $buttonElement.tooltip({title: "Url Copiée"}).tooltip('show');
        setTimeout(() => {
            $buttonElement.tooltip('dispose');
        }, 2000);
    }
}
