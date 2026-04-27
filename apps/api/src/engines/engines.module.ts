import { Module, Global } from '@nestjs/common';
import { BatchGeneratorService } from './batch-generator/batch-generator.service';
import { BomEngineService } from './bom-engine/bom-engine.service';
import { InventoryEngineService } from './inventory-engine/inventory-engine.service';
import { TraceabilityService } from './traceability/traceability.service';

@Global()
@Module({
  providers: [
    BatchGeneratorService,
    BomEngineService,
    InventoryEngineService,
    TraceabilityService,
  ],
  exports: [
    BatchGeneratorService,
    BomEngineService,
    InventoryEngineService,
    TraceabilityService,
  ],
})
export class EnginesModule {}
