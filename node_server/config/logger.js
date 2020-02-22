//Ici ce fichier ne sera pas traité, il est surtout utile pour avoir de "jolies" logs

const winston = require("winston");
const moment = require('moment');

const myCustomLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        verbose: 4,
        highlight: 5,
        silly: 6,
    }
};

const formatSplat = function formatSplat(info){
    const sym = Object.getOwnPropertySymbols(info).find(function(s) {
        return String(s) === "Symbol(splat)";
    });
    if (!sym)
        return "";
    let parametersString = [];
    for(let index in info[sym]){
        let parameter = info[sym][index];
        if (parameter instanceof Error){
            parametersString[0] = parameter.stack;
        }
        else if (typeof parameter !== "string"){
            parametersString.push(JSON.stringify(parameter));
        }
        else {
            parametersString.push(parameter);
        }
    }
    return parametersString.join(' ');
};

winston.addColors({
    highlight: 'yellow',
    silly: 'magenta',
    debug: 'blue',
    verbose: 'cyan',
    info: 'green',
    warn: 'bold yellowBG grey',
    error: 'bold red'
});


const _logger = winston.createLogger({
    level: 'silly',
    levels: myCustomLevels.levels,
    format: winston.format.combine(
        winston.format.simple(),
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf(info =>  `${moment(info.timestamp).format('DD/MM/YYYY HH:mm')} [${info.level}]: ${info.message} ${formatSplat(info)}`)
    )
});

_logger.add(new winston.transports.Console({
    level: 'verbose',
    format: winston.format.combine(
        winston.format.colorize({all: true, colors: myCustomLevels.colors})
    )
}));

module.exports = _logger;
