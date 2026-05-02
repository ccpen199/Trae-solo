import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { EnginesModule } from './engines/engines.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { MaterialModule } from './modules/material/material.module';
import { ProductModule } from './modules/product/product.module';
import { BomModule } from './modules/bom/bom.module';
import { InboundModule } from './modules/inbound/inbound.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.example'],
    }),
    PrismaModule,
    RedisModule,
    EnginesModule,
    AuthModule,
    UserModule,
    SupplierModule,
    MaterialModule,
    ProductModule,
    BomModule,
    InboundModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
