let winston = require('winston');
let settings = require('./config/settings');

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            handleExceptions: true,
            json: false,
            padLevels: true,
            colorize: true
        })
    ],
    exitOnError: false 
});

winston.handleExceptions(new winston.transports.Console({ colorize: true, json: true }));
winston.exitOnError = false;

logger.info("initialized winston");

export = logger;