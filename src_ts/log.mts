import * as winston from "winston";
import {config} from "./config.mjs";

export class Log {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: config.log.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => {
                    return `${info.timestamp} ${info.level.toUpperCase().padStart(5, ' ')}: ${info.message}`;
                })
            ),
            transports: [
                new winston.transports.Console()
            ]
        });

    }

    debug(message: string) {
        this.logger.log('debug', message);
    }
    info(message: string) {
        this.logger.log('info', message);
    }
    warn(message: string) {
        this.logger.log('warning', message);
    }
    error(message: string) {
        this.logger.log('error', message);
    }
}

export const log = new Log();