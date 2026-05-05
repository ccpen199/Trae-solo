require('dotenv').config({ path: '../../.env' });

module.exports = {
  PORT: process.env.BACKEND_PORT || 12264,
  JWT_SECRET: process.env.JWT_SECRET || 'ant_rental_jwt_secret_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  FRONTEND_URL: `http://localhost:${process.env.FRONTEND_PORT || 22264}`,
};
