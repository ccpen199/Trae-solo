const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize = null;
let useSQLite = false;

const initDatabase = async () => {
  try {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    await sequelize.authenticate();
    console.log('PostgreSQL 数据库连接成功');
    useSQLite = false;
  } catch (error) {
    console.log('PostgreSQL 连接失败，启用 SQLite 降级方案...');
    
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../data/database.sqlite'),
      logging: false
    });

    try {
      await sequelize.authenticate();
      console.log('SQLite 数据库连接成功（降级模式）');
      useSQLite = true;
    } catch (sqliteError) {
      console.error('SQLite 连接也失败:', sqliteError);
      throw sqliteError;
    }
  }
  
  return sequelize;
};

const testConnection = async () => {
  if (!sequelize) {
    await initDatabase();
  }
  
  try {
    await sequelize.authenticate();
    console.log('数据库连接测试成功');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    throw error;
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return sequelize;
};

module.exports = {
  initDatabase,
  testConnection,
  getSequelize,
  get sequelize() { return getSequelize(); },
  isUsingSQLite: () => useSQLite
};
