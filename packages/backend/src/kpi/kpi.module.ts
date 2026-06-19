import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KpiController],
})
export class KpiModule {}
