const fs = require('fs');
const path = require('path');
const moment = require('moment');

const LOG_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

const formatLog = (level, message, data = null) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    pid: process.pid
  };
  
  return JSON.stringify(logEntry);
};

const writeToFile = (level, logEntry) => {
  const dateStr = moment().format('YYYY-MM-DD');
  const logFile = path.join(LOG_DIR, `${level.toLowerCase()}-${dateStr}.log`);
  const allLogFile = path.join(LOG_DIR, `all-${dateStr}.log`);
  
  const logLine = logEntry + '\n';
  
  fs.appendFileSync(logFile, logLine, 'utf8');
  fs.appendFileSync(allLogFile, logLine, 'utf8');
};

const logger = {
  debug: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      const logEntry = formatLog('DEBUG', message, data);
      console.debug(logEntry);
      writeToFile('DEBUG', logEntry);
    }
  },
  
  info: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      const logEntry = formatLog('INFO', message, data);
      console.info(logEntry);
      writeToFile('INFO', logEntry);
    }
  },
  
  warn: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      const logEntry = formatLog('WARN', message, data);
      console.warn(logEntry);
      writeToFile('WARN', logEntry);
    }
  },
  
  error: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      const logEntry = formatLog('ERROR', message, data);
      console.error(logEntry);
      writeToFile('ERROR', logEntry);
    }
  },
  
  log: (level, message, data = null) => {
    const levelUpper = level.toUpperCase();
    if (LOG_LEVELS[levelUpper] !== undefined) {
      logger[levelLower](message, data);
    }
  }
};

module.exports = logger;
