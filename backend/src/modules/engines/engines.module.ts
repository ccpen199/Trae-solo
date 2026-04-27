import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumberGeneratorService } from './number-generator.service';
import { BomCalculationEngine } from './bom-calculation.engine';
import { ProcessFlowEngine } from './process-flow.engine';
import { StyleLibraryEngine } from './style-library.engine';
import { ProductionSyncEngine } from './production-sync.engine';
import { Style } from '../styles/entities/style.entity';
import { StyleHistory } from '../styles/entities/style-history.entity';
import { Material } from '../materials/entities/material.entity';
import { ProductionOrder } from '../production/entities/production-order.entity';
import { ProductionProgress } from '../production/entities/production-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Style,
      StyleHistory,
      Material,
      ProductionOrder,
      ProductionProgress,
    ]),
  ],
  providers: [
    NumberGeneratorService,
    BomCalculationEngine,
    ProcessFlowEngine,
    StyleLibraryEngine,
    ProductionSyncEngine,
  ],
  exports: [
    NumberGeneratorService,
    BomCalculationEngine,
    ProcessFlowEngine,
    StyleLibraryEngine,
    ProductionSyncEngine,
  ],
})
export class EnginesModule {}
