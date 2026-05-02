import { config } from '../config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[config.log.level as LogLevel] ?? LOG_LEVELS.info;

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const formatLog = (level: string, message: string, meta?: unknown): string => {
  const timestamp = getTimestamp();
  const levelStr = level.toUpperCase().padEnd(5);
  const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${levelStr} ${message}${metaStr}`;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] <= currentLevel;
};

export const logger = {
  error: (message: string, meta?: unknown): void => {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, meta));
    }
  },
  
  warn: (message: string, meta?: unknown): void => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, meta));
    }
  },
  
  info: (message: string, meta?: unknown): void => {
    if (shouldLog('info')) {
      console.info(formatLog('info', message, meta));
    }
  },
  
  debug: (message: string, meta?: unknown): void => {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, meta));
    }
  },
  
  log: (level: LogLevel, message: string, meta?: unknown): void => {
    logger[level](message, meta);
  },
};

export default logger;
