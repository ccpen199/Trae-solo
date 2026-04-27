import { Module, Global, Provider } from '@nestjs/common';
import Redis from 'ioredis';

const redisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    return new Redis(redisUrl);
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
