export const config = {
  port: process.env.PORT || 8888,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'wms_user',
    password: process.env.DB_PASSWORD || 'wms_password',
    database: process.env.DB_NAME || 'wms_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'wms_secret_key',
    expiresIn: '24h'
  }
};