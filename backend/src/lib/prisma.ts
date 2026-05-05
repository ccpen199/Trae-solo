import { PrismaClient } from '@prisma/client';
import { memoryDb } from './memoryDb';

let prisma: typeof memoryDb | PrismaClient;
let useMemoryDb = false;

async function initPrisma(): Promise<void> {
  try {
    const prismaClient = new PrismaClient();
    await prismaClient.$connect();
    prisma = prismaClient;
    console.log('已连接到PostgreSQL数据库');
  } catch (error) {
    console.warn('PostgreSQL连接失败，将使用内存数据库:', error);
    prisma = memoryDb;
    useMemoryDb = true;
    console.log('已切换到内存数据库模式');
  }
}

initPrisma();

export { prisma, useMemoryDb };
