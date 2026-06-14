import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationConsumer } from './notification.consumer';
import { SmsProvider } from './providers/sms.provider';
import { WechatProvider } from './providers/wechat.provider';
import { InAppProvider } from './providers/in-app.provider';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationConsumer,
    SmsProvider,
    WechatProvider,
    InAppProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
