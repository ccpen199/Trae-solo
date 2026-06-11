export const config = {
  port: Number(process.env.BACKEND_PORT || process.env.PORT) || 59103,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || 'express-terminal-platform-secret-key-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || './data/express-terminal.db',
};
