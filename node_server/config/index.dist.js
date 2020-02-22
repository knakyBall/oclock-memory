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
    game_duration: 120 * 1000,
    revelation_duration: 1000,
    nbCardMaxDefault: 36,

    mysql: {
        host: 'localhost',
        database: 'memory',
        username: 'root',
        password: ''
    }
};