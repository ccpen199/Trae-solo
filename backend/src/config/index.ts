import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '12681', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/app.sqlite',
  jwtSecret: process.env.JWT_SECRET || 'linkworld-default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:12682',
};

export const validateConfig = () => {
  const required = ['jwtSecret'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  缺少环境变量: ${missing.join(', ')}，使用默认值`);
  }
};
