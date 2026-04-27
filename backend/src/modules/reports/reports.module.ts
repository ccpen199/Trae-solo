import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Style } from '../styles/entities/style.entity';
import { Pattern } from '../patterns/entities/pattern.entity';
import { Bom } from '../boms/entities/bom.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { ProductionOrder } from '../production/entities/production-order.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Style,
      Pattern,
      Bom,
      PurchaseOrder,
      ProductionOrder,
    ]),
    EnginesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ReportsModule {}
