const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = process.env.LOG_LEVEL ? levels[process.env.LOG_LEVEL as keyof typeof levels] : levels.info;

function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

export const logger = {
  debug(message: string, data?: any) {
    if (currentLevel <= levels.debug) {
      console.debug(formatMessage('debug', message, data));
    }
  },

  info(message: string, data?: any) {
    if (currentLevel <= levels.info) {
      console.info(formatMessage('info', message, data));
    }
  },

  warn(message: string, data?: any) {
    if (currentLevel <= levels.warn) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error(message: string, data?: any) {
    if (currentLevel <= levels.error) {
      console.error(formatMessage('error', message, data));
    }
  },
};

