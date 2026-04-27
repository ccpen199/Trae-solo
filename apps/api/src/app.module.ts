import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { EnginesModule } from './engines/engines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.example'],
    }),
    PrismaModule,
    RedisModule,
    EnginesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
