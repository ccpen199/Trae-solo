require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

let sequelize = null;
let useSQLite = false;

const getSQLiteDBPath = () => {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'oa_system.db');
};

const initSequelize = () => {
  if (sequelize) return sequelize;

  try {
    const pgOptions = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };

    sequelize = new Sequelize(
      process.env.DB_NAME || 'oa_system',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      pgOptions
    );

    console.log('尝试连接 PostgreSQL...');
    useSQLite = false;
  } catch (pgError) {
    console.log('PostgreSQL 初始化失败，切换到 SQLite...');
    useSQLite = true;
  }

  if (useSQLite) {
    const sqlitePath = getSQLiteDBPath();
    console.log('使用 SQLite 数据库:', sqlitePath);

    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: sqlitePath,
      logging: false
    });
  }

  return sequelize;
};

const getSequelize = () => {
  if (!sequelize) {
    initSequelize();
  }
  return sequelize;
};

const testConnection = async () => {
  const db = getSequelize();
  try {
    await db.authenticate();
    if (useSQLite) {
      console.log('SQLite 数据库连接成功');
    } else {
      console.log('PostgreSQL 数据库连接成功');
    }
    return true;
  } catch (error) {
    console.log('连接失败，尝试切换到 SQLite...');
    
    const sqlitePath = getSQLiteDBPath();
    console.log('使用 SQLite 数据库:', sqlitePath);

    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: sqlitePath,
      logging: false
    });
    
    useSQLite = true;
    
    try {
      await sequelize.authenticate();
      console.log('SQLite 数据库连接成功');
      return true;
    } catch (sqliteError) {
      console.error('SQLite 连接失败:', sqliteError.message);
      throw sqliteError;
    }
  }
};

const isUsingSQLite = () => useSQLite;

module.exports = {
  getSequelize,
  initSequelize,
  testConnection,
  isUsingSQLite
};
