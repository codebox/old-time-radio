import * as winston from "winston";
import {config} from "./config.mjs";

export class Log {

    constructor() {
        const transports = [],
            format = winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => {
                    return `${info.timestamp} ${info.level.toUpperCase().padStart(5, ' ')}: ${info.message}`;
                })
            );

        transports.push(new (winston.transports.Console)({
            level: config.log.level,
            format
        }))

        winston.configure({
            transports
        });
    }

    debug(message: string) {
        winston.log('debug', message);
    }
    info(message: string) {
        winston.log('info', message);
    }
    warn(message: string) {
        winston.log('warning', message);
    }
    error(message: string) {
        winston.log('error', message);
    }
}

export const log = new Log();