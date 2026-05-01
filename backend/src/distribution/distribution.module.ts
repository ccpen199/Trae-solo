import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distribution, DistributionSchedule } from './entities/distribution.entity';
import { DistributionService } from './distribution.service';
import { DistributionController } from './distribution.controller';
import { ContentsModule } from '../contents/contents.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Distribution, DistributionSchedule]),
    ContentsModule,
    AuditModule,
  ],
  controllers: [DistributionController],
  providers: [DistributionService],
  exports: [DistributionService],
})
export class DistributionModule {}
