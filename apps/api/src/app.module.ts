import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PetModule } from './modules/pet/pet.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { FlashSaleModule } from './modules/flash-sale/flash-sale.module';
import { MembershipModule } from './modules/membership/membership.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { TrialModule } from './modules/trial/trial.module';
import { ReviewModule } from './modules/review/review.module';
import { CommunityModule } from './modules/community/community.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { AdoptionModule } from './modules/adoption/adoption.module';
import { SocialModule } from './modules/social/social.module';
import { ActivityModule } from './modules/activity/activity.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      global: true,
      delimiter: '.',
      wildcard: true,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    DatabaseModule,
    RedisModule,
    CommonModule,
    AuthModule,
    UserModule,
    PetModule,
    ProductModule,
    OrderModule,
    FlashSaleModule,
    MembershipModule,
    CouponModule,
    TrialModule,
    ReviewModule,
    CommunityModule,
    DoctorModule,
    ConsultationModule,
    AdoptionModule,
    SocialModule,
    ActivityModule,
    MerchantModule,
    AuditModule,
    AnalyticsModule,
    UploadModule,
    NotificationModule,
    PaymentModule,
    LogisticsModule,
    AdminModule,
  ],
})
export class AppModule {}
