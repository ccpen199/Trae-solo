import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return `${timestamp} [${level}]: ${stack || message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

const transports = [
  new winston.transports.Console({
    format: config.env === 'production' ? prodFormat : devFormat,
  }),
];

if (config.env !== 'development') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  levels: winston.config.npm.levels,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

export default logger;
