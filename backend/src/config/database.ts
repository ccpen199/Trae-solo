import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// 使用单例模式
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;

// 数据库降级方案说明：
// 1. 优先使用 PostgreSQL (DATABASE_URL)
// 2. 若 PostgreSQL 连接失败，系统会在启动时抛出错误
// 3. 降级方案：修改 prisma/schema.prisma 中的 provider 为 "sqlite"，
//    并将 DATABASE_URL 指向 SQLite 文件路径
// 4. SQLite 是本地文件数据库，无需额外安装，适合快速开发和演示
