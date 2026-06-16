import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { ApplicationModule } from '../application/application.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ApplicationModule, NotificationModule],
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
