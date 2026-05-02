require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/equipment-maintenance',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  uploadPath: process.env.UPLOAD_PATH || './uploads'
};