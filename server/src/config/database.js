const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const useSQLite = process.env.DB_USE_SQLITE === 'true' || false;

let sequelize;

if (useSQLite) {
  console.log('Using SQLite as database (fallback mode)');
  const sqlitePath = path.join(__dirname, '../../data/database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  console.log('Using PostgreSQL as database');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
