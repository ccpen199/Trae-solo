import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getConfig(key?: string) {
    if (key) {
      const cfg = await this.prisma.systemConfig.findUnique({ where: { configKey: key } });
      if (!cfg) throw new NotFoundException('配置不存在');
      return cfg;
    }
    return this.prisma.systemConfig.findMany({ orderBy: { configKey: 'asc' } });
  }

  async setConfig(key: string, value: string, description?: string, isEncrypted = false) {
    this.logger.log(`更新系统配置: ${key}`, 'SystemService');
    return this.prisma.systemConfig.upsert({
      where: { configKey: key },
      update: { configValue: value, description, isEncrypted },
      create: { configKey: key, configValue: value, description, isEncrypted },
    });
  }

  async deleteConfig(key: string) {
    return this.prisma.systemConfig.delete({ where: { configKey: key } });
  }

  async getHealth() {
    const dbStatus = await this.prisma.$queryRawUnsafe('SELECT 1 as alive').catch(() => null);
    return {
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus ? 'up' : 'down',
      },
    };
  }
}
