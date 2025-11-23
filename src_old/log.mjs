import * as winston from "winston";
import { config } from "./config.mjs";
export class Log {
    logger;
    constructor() {
        this.logger = winston.createLogger({
            level: config.log.level,
            format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.timestamp(), winston.format.printf(info => {
                return `${info.timestamp} ${info.level.toUpperCase().padStart(5, ' ')}: ${info.message}`;
            })),
            transports: [
                new winston.transports.Console()
            ]
        });
    }
    debug(message) {
        this.logger.log('debug', message);
    }
    info(message) {
        this.logger.log('info', message);
    }
    warn(message) {
        this.logger.log('warn', message);
    }
    error(message, error) {
        if (error) {
            this.logger.log('error', `${message}\n${error.stack}`);
        }
        else {
            this.logger.log('error', message);
        }
    }
}
export const log = new Log();
//# sourceMappingURL=log.mjs.map