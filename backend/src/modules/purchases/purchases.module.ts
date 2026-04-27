import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem]),
    EnginesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class PurchasesModule {}
