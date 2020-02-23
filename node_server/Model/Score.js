const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');

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
Score.sync();
module.exports = Score;