import { Module } from '@nestjs/common';
import { AccessDeviceController, AccessAuthController, AccessLogController } from './access.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccessDeviceController, AccessAuthController, AccessLogController],
})
export class AccessModule {}
