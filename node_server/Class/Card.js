const config = require('../config');

/**  @typedef {(import(`./Player`))} Player **/
function Card(fruit) {
    if (fruit && config.available_fruits.includes(fruit)) {
        this.fruit = fruit
    }
    else if (fruit === null){
        this.fruit = config.available_fruits[Math.floor(Math.random() * config.available_fruits.length)];
    }
    else throw new Error(`Ce fruit n'est pas disponible`);

    this.revealed = false;
}

//Récupère le fruit de la carte
Card.prototype.getFruit = function (){
    return this.fruit;
};

//Récupère le fruit de la carte
Card.prototype.setRevealState = function (revealed){
    return this.revealed = revealed;
};

//Récupère le fruit de la carte
Card.prototype.toObject = function (){
    return {
        fruit: this.revealed ? this.fruit : 'backed'
    };
};

module.exports = Card;
