const path = require('path');
const { Sequelize } = require('sequelize');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  dialectOptions: {
    timeout: 10000,
  },
  pool: {
    max: 1,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
  retry: {
    match: [/SQLITE_BUSY/, /database is locked/i],
    max: 5,
  },
  define: {
    freezeTableName: true,
    underscored: true,
  },
});

module.exports = sequelize;
