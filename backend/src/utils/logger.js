const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', '..', 'backend.log');

const ensureLogFile = () => {
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '');
  }
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
};

const writeLog = (level, message, meta) => {
  ensureLogFile();
  const logLine = formatLog(level, message, meta);
  fs.appendFileSync(logFilePath, logLine);
};

const logger = {
  info: (message, meta) => {
    writeLog('info', message, meta);
    console.log(`[INFO] ${message}`, meta || '');
  },
  warn: (message, meta) => {
    writeLog('warn', message, meta);
    console.warn(`[WARN] ${message}`, meta || '');
  },
  error: (message, meta) => {
    writeLog('error', message, meta);
    console.error(`[ERROR] ${message}`, meta || '');
  },
  debug: (message, meta) => {
    writeLog('debug', message, meta);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  },
  request: (req, res, duration) => {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };
    writeLog('request', `${req.method} ${req.originalUrl}`, meta);
  }
};

module.exports = logger;
