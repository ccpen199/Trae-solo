const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const db = require('./models');

const PORT = process.env.BACKEND_PORT || 58945;
const HOST = '127.0.0.1';

async function start() {
  try {
    await db.sync();
    console.log('数据库同步完成');
    console.log('演示数据初始化完成');

    app.listen(PORT, HOST, () => {
      console.log(`服务已启动: http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();
