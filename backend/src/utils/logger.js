const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../../backend.log');

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  
  console.log(logMessage + dataStr);
  
  fs.appendFileSync(logPath, logMessage + dataStr + '\n');
};

module.exports = {
  info: (msg, data) => log('info', msg, data),
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  debug: (msg, data) => log('debug', msg, data)
};
