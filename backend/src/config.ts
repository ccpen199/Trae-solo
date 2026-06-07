import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '59015', 10),
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  host: '127.0.0.1'
};
