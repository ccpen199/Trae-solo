const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('ℹ️ 提示：请确保 PostgreSQL 服务已启动，或者使用本地模拟数据模式');
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库表同步完成');
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
