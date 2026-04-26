import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { AccountModule } from './modules/account/account.module';
import { QualityModule } from './modules/quality/quality.module';
import { ColdChainModule } from './modules/cold-chain/cold-chain.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { PriceAdjustmentModule } from './engines/price-adjustment/price-adjustment.module';
import { ColdChainExceptionModule } from './engines/cold-chain-exception/cold-chain-exception.module';
import { MultiPartyClearingModule } from './engines/multi-party-clearing/multi-party-clearing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrderModule,
    AccountModule,
    QualityModule,
    ColdChainModule,
    SettlementModule,
    AuditModule,
    NotificationModule,
    PriceAdjustmentModule,
    ColdChainExceptionModule,
    MultiPartyClearingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
