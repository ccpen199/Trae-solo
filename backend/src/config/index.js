require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '12611', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'taobaobar_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  db: {
    path: process.env.DB_PATH || './data/app.sqlite'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:12612'
  },
  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'admin123456'
  }
};

module.exports = config;
