const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: parseInt(process.env.PORT || '12238'),
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:22238',
  nodeEnv: process.env.NODE_ENV || 'development',
};
