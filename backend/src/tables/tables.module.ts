import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { Table } from './entities/table.entity';
import { Order } from '../orders/entities/order.entity';
import { TableStatusEngine } from './engines/table-status.engine';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, Order]),
    WebSocketModule,
  ],
  controllers: [TablesController],
  providers: [TablesService, TableStatusEngine],
  exports: [TablesService, TableStatusEngine],
})
export class TablesModule {}
