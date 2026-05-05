require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '12254', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'auth_server_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  database: {
    url: process.env.DATABASE_URL
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:21225'
  }
};
