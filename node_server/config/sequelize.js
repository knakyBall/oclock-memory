const config = require('./index');
const Sequelize = require('sequelize');

// Option 1: Passing parameters separately
module.exports = new Sequelize(config.mysql.database, config.mysql.username, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});