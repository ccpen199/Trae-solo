const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(dbPath),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    timeout: 30000
  }
});

try {
  const Database = require('better-sqlite3');
  sequelize.queryInterface.QueryGenerator.dialect.supports.returnValues = true;
} catch (e) {
  console.log('Using default sqlite dialect');
}

module.exports = sequelize;
