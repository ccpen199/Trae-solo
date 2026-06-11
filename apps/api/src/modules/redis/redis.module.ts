import { Module, Global, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';

const redisClientProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService): Redis => {
    const host = configService.get<string>('REDIS_HOST', 'localhost');
    const port = configService.get<number>('REDIS_PORT', 6379);
    const password = configService.get<string>('REDIS_PASSWORD', '');
    const db = configService.get<number>('REDIS_DB', 0);

    return new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: true,
      enableReadyCheck: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisClientProvider, RedisService, CacheService],
  exports: ['REDIS_CLIENT', RedisService, CacheService],
})
export class RedisModule {}
