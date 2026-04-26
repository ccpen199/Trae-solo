import { Module } from '@nestjs/common';
import { PriceAdjustmentController } from './controllers/price-adjustment.controller';
import { PriceAdjustmentEngine } from './services/price-adjustment-engine.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../../modules/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PriceAdjustmentController],
  providers: [PriceAdjustmentEngine],
  exports: [PriceAdjustmentEngine],
})
export class PriceAdjustmentModule {}
