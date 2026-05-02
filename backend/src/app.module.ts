import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MachineriesModule } from './machineries/machineries.module';
import { DemandsModule } from './demands/demands.module';
import { OrdersModule } from './orders/orders.module';
import { RepairOrdersModule } from './repair-orders/repair-orders.module';
import { WorkTracksModule } from './work-tracks/work-tracks.module';
import { SettlementsModule } from './settlements/settlements.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StateMachineModule } from './state-machine/state-machine.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { DispatchEngineModule } from './engines/dispatch/dispatch-engine.module';
import { TrackVerifyEngineModule } from './engines/track-verify/track-verify-engine.module';
import { BillingEngineModule } from './engines/billing/billing-engine.module';
import { CreditEngineModule } from './engines/credit/credit-engine.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HomeModule } from './home/home.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    HomeModule,
    AuthModule,
    UsersModule,
    MachineriesModule,
    DemandsModule,
    OrdersModule,
    RepairOrdersModule,
    WorkTracksModule,
    SettlementsModule,
    ReviewsModule,
    StateMachineModule,
    AuditLogModule,
    DispatchEngineModule,
    TrackVerifyEngineModule,
    BillingEngineModule,
    CreditEngineModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
