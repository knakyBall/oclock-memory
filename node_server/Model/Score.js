const Sequelize = require('sequelize');
//Récupération de la connexion à la BDD
const sequelize = require('../config/sequelize');


//Création du model Score, qui est en fait le reflet de la table score.

const Model = Sequelize.Model;
class Score extends Model {}
Score.init({
    pseudo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    started_at: {
        type: Sequelize.TIME,
        allowNull: false
    },
    finished_at: {
        type: Sequelize.TIME,
        allowNull: false
    },
    nb_cards: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    nb_try: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'score'
});

//Cette ligne permet de créer la table en BDD si elle n'existe pas déjà
Score.sync();
module.exports = Score;