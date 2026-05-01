require('dotenv').config();
const { syncDatabase } = require('../models');
const logger = require('../utils/logger');

async function initDatabase() {
  console.log('========================================');
  console.log('  初始化数据库');
  console.log('========================================');
  
  try {
    console.log('正在同步数据库表...');
    await syncDatabase(false);
    
    console.log('');
    console.log('数据库初始化完成！');
    console.log('');
    console.log('默认账户信息：');
    console.log('  用户名: admin');
    console.log('  密码: admin123456');
    console.log('');
    console.log('服务端口配置：');
    console.log('  后端 API: 8762');
    console.log('  运营管理前端: 8763');
    console.log('  读者端前端: 8764');
    console.log('  广告主看板: 8765');
    console.log('');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    logger.error('数据库初始化失败', error);
    process.exit(1);
  }
}

initDatabase();
