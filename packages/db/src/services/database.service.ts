import { PrismaClient } from '../generated/client';
import { BaseRepository } from '../repositories/base.repository';

export class DatabaseService {
  private static instance: PrismaClient;
  private static repositories: Map<string, BaseRepository> = new Map();

  static getClient(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return DatabaseService.instance;
  }

  static async connect(): Promise<void> {
    await DatabaseService.getClient().$connect();
  }

  static async disconnect(): Promise<void> {
    await DatabaseService.getClient().$disconnect();
  }

  static async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return DatabaseService.getClient().$transaction(fn);
  }

  static registerRepository<T extends BaseRepository>(name: string, repository: T): T {
    DatabaseService.repositories.set(name, repository);
    return repository;
  }

  static getRepository<T extends BaseRepository>(name: string): T | undefined {
    return DatabaseService.repositories.get(name) as T;
  }
}
