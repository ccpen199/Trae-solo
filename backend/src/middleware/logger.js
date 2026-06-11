const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

morgan.token('userId', (req) => req.headers['x-user-id'] || 'anonymous');
morgan.token('network', (req) => req.networkStatus || 'unknown');

const fileLogger = morgan(
  ':remote-addr - :userId [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" network=:network',
  { stream: accessLogStream }
);

const consoleLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length] - user=:userId net=:network',
  { immediate: false }
);

module.exports = { fileLogger, consoleLogger };
