import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

const logDir = config.log.dir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const requestId = meta.requestId ? ` [${meta.requestId}]` : '';
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}]${requestId} ${level}: ${message}${extra}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: config.isProd ? 'info' : 'debug',
    format: consoleFormat
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 14,
    format: logFormat
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    level: config.log.level,
    maxsize: 50 * 1024 * 1024,
    maxFiles: 30,
    format: logFormat
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'audit.log'),
    level: 'info',
    maxsize: 100 * 1024 * 1024,
    maxFiles: 90,
    format: logFormat,
    filter: winston.format((info) => {
      return info.audit ? info : false;
    })
  })
];

const logger = winston.createLogger({
  level: config.log.level,
  levels: {
    ...winston.config.npm.levels,
    audit: 2,
    http: 6
  },
  format: logFormat,
  transports,
  exitOnError: false
});

export const auditLogger = {
  log: (action: string, details: Record<string, unknown>) => {
    logger.info(`[AUDIT] ${action}`, {
      audit: true,
      action,
      ...details
    });
  },
  citizenAction: (citizenId: string, action: string, resource?: string) => {
    logger.info(`[AUDIT-CITIZEN] ${citizenId} - ${action}`, {
      audit: true,
      type: 'citizen',
      citizenId,
      action,
      resource
    });
  },
  apiAccess: (adapterCode: string, endpoint: string, status: number, duration: number) => {
    logger.info(`[AUDIT-API] ${adapterCode} - ${endpoint}`, {
      audit: true,
      type: 'department-api',
      adapter: adapterCode,
      endpoint,
      status,
      duration
    });
  },
  systemEvent: (event: string, details: Record<string, unknown>) => {
    logger.info(`[AUDIT-SYSTEM] ${event}`, {
      audit: true,
      type: 'system',
      event,
      ...details
    });
  }
};

export default logger;
