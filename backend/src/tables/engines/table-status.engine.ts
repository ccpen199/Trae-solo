import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../../tables/entities/table.entity';
import { Order } from '../../orders/entities/order.entity';
import { TableStatus, OrderStatus, OrderType } from '../../common/types';
import { WebSocketGatewayService } from '../../websocket/websocket-gateway.service';

export interface TableTransition {
  from: TableStatus;
  to: TableStatus;
  requiredOrderStatus?: OrderStatus[];
}

@Injectable()
export class TableStatusEngine {
  private readonly logger = new Logger(TableStatusEngine.name);

  private readonly validTransitions: TableTransition[] = [
    { from: TableStatus.VACANT, to: TableStatus.RESERVED },
    { from: TableStatus.VACANT, to: TableStatus.OCCUPIED },
    { from: TableStatus.RESERVED, to: TableStatus.OCCUPIED },
    { from: TableStatus.RESERVED, to: TableStatus.VACANT },
    { from: TableStatus.OCCUPIED, to: TableStatus.CLEANING },
    { from: TableStatus.CLEANING, to: TableStatus.VACANT },
  ];

  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly webSocketService: WebSocketGatewayService,
  ) {}

  canTransition(from: TableStatus, to: TableStatus): boolean {
    return this.validTransitions.some(
      (t) => t.from === from && t.to === to,
    );
  }

  async occupyTable(
    tableId: string,
    operatorId: string,
    guestCount: number = 1,
  ): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    if (
      table.status !== TableStatus.VACANT &&
      table.status !== TableStatus.RESERVED
    ) {
      throw new Error(`桌台状态不允许占用: ${table.status}`);
    }

    const oldStatus = table.status;
    table.status = TableStatus.OCCUPIED;

    await this.tableRepository.save(table);

    this.webSocketService.notifyTableStatusChange(table);

    this.logger.log(
      `桌台 ${table.tableNumber} 状态变更: ${oldStatus} -> ${TableStatus.OCCUPIED}`,
    );

    return table;
  }

  async markTableCleaning(tableId: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    if (table.status !== TableStatus.OCCUPIED) {
      throw new Error(`桌台状态不允许标记为清台: ${table.status}`);
    }

    const activeOrder = await this.orderRepository.findOne({
      where: {
        tableId: table.id,
        status: OrderStatus.COMPLETED,
      },
      order: { createdAt: 'DESC' },
    });

    if (activeOrder && activeOrder.paidAmount < activeOrder.payableAmount) {
      throw new Error(`该桌台存在未结清账单`);
    }

    const oldStatus = table.status;
    table.status = TableStatus.CLEANING;
    table.currentOrderId = null;

    await this.tableRepository.save(table);

    this.webSocketService.notifyTableStatusChange(table);

    this.logger.log(
      `桌台 ${table.tableNumber} 状态变更: ${oldStatus} -> ${TableStatus.CLEANING}`,
    );

    return table;
  }

  async markTableVacant(tableId: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    if (table.status !== TableStatus.CLEANING) {
      throw new Error(`桌台状态不允许标记为空闲: ${table.status}`);
    }

    const oldStatus = table.status;
    table.status = TableStatus.VACANT;

    await this.tableRepository.save(table);

    this.webSocketService.notifyTableStatusChange(table);

    this.logger.log(
      `桌台 ${table.tableNumber} 状态变更: ${oldStatus} -> ${TableStatus.VACANT}`,
    );

    return table;
  }

  async reserveTable(tableId: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    if (table.status !== TableStatus.VACANT) {
      throw new Error(`桌台状态不允许预订: ${table.status}`);
    }

    const oldStatus = table.status;
    table.status = TableStatus.RESERVED;

    await this.tableRepository.save(table);

    this.webSocketService.notifyTableStatusChange(table);

    this.logger.log(
      `桌台 ${table.tableNumber} 状态变更: ${oldStatus} -> ${TableStatus.RESERVED}`,
    );

    return table;
  }

  async cancelReservation(tableId: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    if (table.status !== TableStatus.RESERVED) {
      throw new Error(`桌台状态不允许取消预订: ${table.status}`);
    }

    const oldStatus = table.status;
    table.status = TableStatus.VACANT;

    await this.tableRepository.save(table);

    this.webSocketService.notifyTableStatusChange(table);

    this.logger.log(
      `桌台 ${table.tableNumber} 状态变更: ${oldStatus} -> ${TableStatus.VACANT}`,
    );

    return table;
  }

  async getTableStatusSummary(): Promise<{
    total: number;
    vacant: number;
    occupied: number;
    cleaning: number;
    reserved: number;
  }> {
    const [tables, count] = await this.tableRepository.findAndCount({
      where: { isActive: true },
    });

    const summary = {
      total: count,
      vacant: 0,
      occupied: 0,
      cleaning: 0,
      reserved: 0,
    };

    for (const table of tables) {
      switch (table.status) {
        case TableStatus.VACANT:
          summary.vacant++;
          break;
        case TableStatus.OCCUPIED:
          summary.occupied++;
          break;
        case TableStatus.CLEANING:
          summary.cleaning++;
          break;
        case TableStatus.RESERVED:
          summary.reserved++;
          break;
      }
    }

    return summary;
  }

  async checkTableAvailability(tableId: string): Promise<{
    available: boolean;
    status: TableStatus;
    currentOrder?: Order;
  }> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      throw new Error(`桌台不存在: ${tableId}`);
    }

    const available = table.status === TableStatus.VACANT;

    let currentOrder: Order = null;
    if (table.currentOrderId) {
      currentOrder = await this.orderRepository.findOne({
        where: { id: table.currentOrderId },
      });
    }

    return {
      available,
      status: table.status,
      currentOrder,
    };
  }
}
