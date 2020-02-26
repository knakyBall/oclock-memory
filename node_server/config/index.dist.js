//Configuration de l'application
module.exports = {
    available_fruits: [
        'red-apple',
        'banana',
        'peach',
        'green-lemon',
        'pomegranate',
        'apricot',
        'yellow-lemon',
        'strawberry',
        'green-apple',
        'nectarine',
        'green-grape',
        'watermelon',
        'purple-plum',
        'pear',
        'red-cherry',
        'red-grape',
        'mango',
        'yellow-cherry'
    ],
    game_duration: 60 * 1000,
    revelation_duration: 1000,
    nbCardMaxDefault: 16,
    nbPlayerMax: 2,

    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_NAME || 'memory',
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || ''
    }
};
