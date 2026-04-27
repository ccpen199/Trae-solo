import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionProgress } from './entities/production-progress.entity';
import { ProductionIssue } from './entities/production-issue.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionOrder,
      ProductionProgress,
      ProductionIssue,
    ]),
    EnginesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ProductionModule {}
