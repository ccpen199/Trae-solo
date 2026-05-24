import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(dbPath);
const dbDir = path.dirname(resolvedDbPath);

function deleteOldDatabase(): void {
  const filesToDelete = [
    resolvedDbPath,
    `${resolvedDbPath}-wal`,
    `${resolvedDbPath}-shm`
  ];

  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`已删除旧文件: ${file}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log('========================================');
    console.log('开始初始化数据库...');
    console.log('========================================\n');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`已创建数据目录: ${dbDir}\n`);
    }

    console.log('1. 删除旧数据库文件...');
    deleteOldDatabase();
    console.log('✓ 旧数据库文件已删除\n');

    const { db, query } = await import('../config/database');
    const { initTables, initPermissions, initTestUsers, initTestCars } = await import('../utils/database');

    console.log('2. 创建数据库表结构...');
    initTables();
    console.log('✓ 数据库表结构创建完成\n');

    console.log('3. 插入权限数据...');
    initPermissions();
    const permissionsCount = countRows(query, 'permissions');
    console.log(`✓ 权限数据插入完成，共 ${permissionsCount} 条记录\n`);

    console.log('4. 插入测试用户数据...');
    initTestUsers();
    const usersCount = countRows(query, 'users');
    console.log(`✓ 测试用户数据插入完成，共 ${usersCount} 条记录\n`);

    console.log('5. 插入测试车源数据...');
    initTestCars();
    const carsCount = countRows(query, 'cars');
    console.log(`✓ 测试车源数据插入完成，共 ${carsCount} 条记录\n`);

    console.log('========================================');
    console.log('数据库初始化完成！');
    console.log('========================================\n');

    console.log('初始化结果统计:');
    console.log(`  - 权限配置: ${permissionsCount} 条`);
    console.log(`  - 用户数据: ${usersCount} 条`);
    console.log(`  - 车源数据: ${carsCount} 条`);
    console.log(`  - 数据库文件: ${resolvedDbPath}`);
    console.log('\n测试账号（密码均为 123456）:');
    console.log('  - admin / 123456 (系统管理员)');
    console.log('  - dealer1 / 123456 (车商)');
    console.log('  - buyer1 / 123456 (买家)');
    console.log('  - inspector1 / 123456 (检测师)');
    console.log('  - sales1 / 123456 (销售)');
    console.log('  - cs1 / 123456 (客服)');
    console.log('  - finance1 / 123456 (财务)');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:');
    console.error(error);
    process.exit(1);
  }
}

type QueryFunction = (sql: string, params?: unknown[], jsonFields?: string[]) => { count: number }[];

function countRows(queryFn: QueryFunction, tableName: string): number {
  const result = queryFn(`SELECT COUNT(*) as count FROM ${tableName}`);
  return result[0]?.count || 0;
}

main();
