const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.BACKEND_PORT || '59088', 10),
  host: process.env.HOST || '127.0.0.1',
  frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:49088',
  jwtSecret: process.env.JWT_SECRET || 'hrss-national-platform-secret-key-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databasePath: process.env.DATABASE_PATH || './data/app.sqlite',
  sm2: {
    privateKey: process.env.SM2_PRIVATE_KEY,
    publicKey: process.env.SM2_PUBLIC_KEY,
  },
  sm4Key: process.env.SM4_KEY,
  govAuth: {
    url: process.env.GOV_AUTH_URL,
    clientId: process.env.GOV_CLIENT_ID,
    clientSecret: process.env.GOV_CLIENT_SECRET,
  },
};
