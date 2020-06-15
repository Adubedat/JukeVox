import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.splat(),
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.printf((info) => `${info.timestamp} [IP: ${info.IP}][User-Agent: ${info.userAgent}] [${info.level}] ${info.message}`),
  ),
  transports: [
    //
    // - Write all logs in the console
    //
    new transports.Console(),
  ],
});

export default logger;
