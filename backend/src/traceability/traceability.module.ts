import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraceabilityService } from './traceability.service';
import { TraceabilityController } from './traceability.controller';
import { FarmingRecord } from './entities/farming-record.entity';
import { HighYieldAnalysis } from './entities/high-yield-analysis.entity';
import { StandardizedModel } from './entities/standardized-model.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { AgronomyModule } from '../agronomy/agronomy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FarmingRecord, HighYieldAnalysis, StandardizedModel]),
    SensorsModule,
    AgronomyModule,
    AuditModule,
  ],
  providers: [TraceabilityService],
  controllers: [TraceabilityController],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
