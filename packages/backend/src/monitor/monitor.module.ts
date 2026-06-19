import { Module } from '@nestjs/common';
import { AlertController, MonitorController } from './monitor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlertController, MonitorController],
})
export class MonitorModule {}
