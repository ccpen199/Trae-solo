require('dotenv').config();

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 3001,
  wsPort: process.env.WS_PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || './data/surveillance.db',
  sm4Key: process.env.SM4_KEY || '0123456789abcdef0123456789abcdef',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  recordPath: process.env.RECORD_PATH || './uploads/records',
  sms: {
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET
  },
  wechat: {
    appid: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET,
    templateId: process.env.WECHAT_TEMPLATE_ID
  },
  ffmpegPath: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg'
};
