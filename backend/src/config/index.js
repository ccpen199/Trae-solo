require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '11531'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'im-system-jwt-secret-2024',
  dbPath: process.env.DB_PATH || './data/app.sqlite',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:11532',
};
