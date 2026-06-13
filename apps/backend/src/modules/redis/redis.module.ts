import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || 'redis_secure_pwd_2024',
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {
  constructor() {}
}
