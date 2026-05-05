require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize = null;
let useMemory = false;
let useSQLite = false;

const tryPostgreSQL = async () => {
  try {
    const pgConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };

    const pgSequelize = new Sequelize(
      process.env.DB_NAME || 'bbs_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      pgConfig
    );

    await pgSequelize.authenticate();
    console.log('✓ PostgreSQL 连接成功');
    return pgSequelize;
  } catch (error) {
    console.log('✗ PostgreSQL 连接失败:', error.message);
    return null;
  }
};

const trySQLite = async () => {
  try {
    require.resolve('sqlite3');
    
    const path = require('path');
    const fs = require('fs');
    
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const sqlitePath = path.join(dataDir, 'bbs.db');
    const sqliteSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: sqlitePath,
      logging: false
    });

    await sqliteSequelize.authenticate();
    console.log('✓ SQLite 连接成功:', sqlitePath);
    useSQLite = true;
    return sqliteSequelize;
  } catch (error) {
    console.log('✗ SQLite 不可用:', error.message);
    return null;
  }
};

const tryMemory = () => {
  console.log('→ 使用内存存储（临时数据，重启后丢失）');
  console.log('  提示：如需持久化数据，请安装 PostgreSQL 或 sqlite3');
  
  const memorySequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
  
  useMemory = true;
  return memorySequelize;
};

const initDatabase = async () => {
  if (sequelize) return sequelize;

  console.log('正在初始化数据库连接...');
  
  sequelize = await tryPostgreSQL();
  if (sequelize) return sequelize;

  sequelize = await trySQLite();
  if (sequelize) return sequelize;

  sequelize = tryMemory();
  return sequelize;
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sequelize;
};

const isUsingMemory = () => useMemory;
const isUsingSQLite = () => useSQLite;

module.exports = {
  initDatabase,
  getSequelize,
  isUsingMemory,
  isUsingSQLite
};

module.exports.default = null;
