import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderLog } from './entities/order-log.entity';
import { Table } from '../tables/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { OrderFlowEngine } from './engines/order-flow.engine';
import { KitchenPrintEngine } from './engines/kitchen-print.engine';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderLog, Table, MenuItem]),
    WebSocketModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderFlowEngine, KitchenPrintEngine],
  exports: [OrdersService, OrderFlowEngine, KitchenPrintEngine],
})
export class OrdersModule {}
