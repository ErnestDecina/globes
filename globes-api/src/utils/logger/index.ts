import * as winston from 'winston';

// Logger Levels
const logger_levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Logger Colours
const logger_colours = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
    debug: 'green'
};

winston.addColors(logger_colours);


const logger_format = winston.format.combine(
    winston.format.timestamp({format: 'DD-MM-YYYY HH:mm:ss:ms'}),
    winston.format.colorize({all: true}),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);


const logger_transport = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
    }),
    new winston.transports.File({
        filename: 'logs/all.log'
    })
];

function logger_level() : string {
    return true ? 'debug' : 'http';
}

const Logger = winston.createLogger({
    level: logger_level(),
    levels: logger_levels,
    format: logger_format,
    transports: logger_transport
});

export default Logger;