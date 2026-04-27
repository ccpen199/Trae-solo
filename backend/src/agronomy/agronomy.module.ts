import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgronomyService } from './agronomy.service';
import { AgronomyController } from './agronomy.controller';
import { Crop } from './entities/crop.entity';
import { GrowthStage } from './entities/growth-stage.entity';
import { EnvironmentThreshold } from './entities/environment-threshold.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Crop, GrowthStage, EnvironmentThreshold]),
    AuditModule,
  ],
  providers: [AgronomyService],
  controllers: [AgronomyController],
  exports: [AgronomyService],
})
export class AgronomyModule {}
