const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const createDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('连接到默认 postgres 数据库成功');

    // 检查数据库是否存在
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (result.rows.length === 0) {
      // 创建数据库
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`数据库 ${process.env.DB_NAME} 创建成功`);
    } else {
      console.log(`数据库 ${process.env.DB_NAME} 已存在`);
    }
  } catch (error) {
    console.error('创建数据库失败:', error.message);
    console.error('请确保 PostgreSQL 服务已启动，并且配置正确');
    process.exit(1);
  } finally {
    await client.end();
  }
};

createDatabase();
