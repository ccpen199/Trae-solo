import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderLog } from '../entities/order-log.entity';
import { OrderStatus, OrderItemStatus, OrderLogAction } from '../../common/types';
import { WebSocketGatewayService } from '../../websocket/websocket-gateway.service';

export interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
  requiredActions?: string[];
}

@Injectable()
export class OrderFlowEngine {
  private readonly logger = new Logger(OrderFlowEngine.name);

  private readonly validTransitions: OrderTransition[] = [
    { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED },
    { from: OrderStatus.CONFIRMED, to: OrderStatus.PREPARING },
    { from: OrderStatus.PREPARING, to: OrderStatus.READY },
    { from: OrderStatus.READY, to: OrderStatus.SERVED },
    { from: OrderStatus.SERVED, to: OrderStatus.COMPLETED },
    { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED },
    { from: OrderStatus.CONFIRMED, to: OrderStatus.CANCELLED },
  ];

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderLog)
    private orderLogRepository: Repository<OrderLog>,
    private readonly webSocketService: WebSocketGatewayService,
  ) {}

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return this.validTransitions.some(
      (t) => t.from === from && t.to === to,
    );
  }

  async transitionOrder(
    orderId: string,
    newStatus: OrderStatus,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (!this.canTransition(order.status, newStatus)) {
      throw new Error(
        `无效的状态转换: ${order.status} -> ${newStatus}`,
      );
    }

    const oldStatus = order.status;
    order.status = newStatus;

    const statusTimestamp = this.getStatusTimestampField(newStatus);
    if (statusTimestamp) {
      (order as any)[statusTimestamp] = new Date();
    }

    await this.orderRepository.save(order);

    await this.createOrderLog(
      orderId,
      OrderLogAction.STATUS_CHANGED,
      `订单状态变更: ${oldStatus} -> ${newStatus}`,
      {
        oldStatus,
        newStatus,
      },
      operatorId,
      operatorName,
      operatorRole,
    );

    this.webSocketService.notifyOrderStatusChange(order);

    this.logger.log(
      `订单 ${order.orderNumber} 状态变更: ${oldStatus} -> ${newStatus}`,
    );

    return order;
  }

  async transitionOrderItem(
    orderItemId: string,
    newStatus: OrderItemStatus,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderRepository.manager.findOne(OrderItem, {
      where: { id: orderItemId },
      relations: ['order'],
    });

    if (!orderItem) {
      throw new Error(`订单项不存在: ${orderItemId}`);
    }

    const oldStatus = orderItem.status;
    orderItem.status = newStatus;

    const statusTimestamp = this.getOrderItemStatusTimestampField(newStatus);
    if (statusTimestamp) {
      (orderItem as any)[statusTimestamp] = new Date();
    }

    await this.orderRepository.manager.save(OrderItem, orderItem);

    await this.createOrderLog(
      orderItem.orderId,
      OrderLogAction.ITEM_STATUS_CHANGED,
      `订单项状态变更: ${orderItem.name} ${oldStatus} -> ${newStatus}`,
      {
        orderItemId: orderItem.id,
        itemName: orderItem.name,
        oldStatus,
        newStatus,
      },
      operatorId,
      operatorName,
      operatorRole,
    );

    if (orderItem.order) {
      this.webSocketService.notifyOrderItemStatusChange(
        orderItem.order.id,
        orderItem,
      );
    }

    return orderItem;
  }

  async canAllItemsComplete(
    orderId: string,
    targetStatus: OrderItemStatus,
  ): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order || !order.items.length) {
      return false;
    }

    const activeItems = order.items.filter(
      (item) =>
        item.status !== OrderItemStatus.CANCELLED &&
        item.status !== OrderItemStatus.REFUNDED,
    );

    return activeItems.every((item) => item.status === targetStatus);
  }

  async autoTransitionOrderIfAllItemsComplete(
    orderId: string,
    targetItemStatus: OrderItemStatus,
    targetOrderStatus: OrderStatus,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<boolean> {
    const canTransition = await this.canAllItemsComplete(
      orderId,
      targetItemStatus,
    );

    if (!canTransition) {
      return false;
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order.status !== OrderStatus.PREPARING && targetOrderStatus === OrderStatus.READY) {
      return false;
    }

    if (order.status !== OrderStatus.READY && targetOrderStatus === OrderStatus.SERVED) {
      return false;
    }

    await this.transitionOrder(
      orderId,
      targetOrderStatus,
      operatorId,
      operatorName,
      operatorRole,
    );

    return true;
  }

  private getStatusTimestampField(status: OrderStatus): string | null {
    const timestampMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: null,
      [OrderStatus.CONFIRMED]: 'confirmedAt',
      [OrderStatus.PREPARING]: 'preparingAt',
      [OrderStatus.READY]: 'readyAt',
      [OrderStatus.SERVED]: 'servedAt',
      [OrderStatus.COMPLETED]: 'completedAt',
      [OrderStatus.CANCELLED]: 'cancelledAt',
    };
    return timestampMap[status];
  }

  private getOrderItemStatusTimestampField(
    status: OrderItemStatus,
  ): string | null {
    const timestampMap: Record<OrderItemStatus, string> = {
      [OrderItemStatus.PENDING]: null,
      [OrderItemStatus.PREPARING]: 'preparingAt',
      [OrderItemStatus.READY]: 'readyAt',
      [OrderItemStatus.SERVED]: 'servedAt',
      [OrderItemStatus.CANCELLED]: null,
      [OrderItemStatus.REFUNDED]: null,
    };
    return timestampMap[status];
  }

  private async createOrderLog(
    orderId: string,
    action: OrderLogAction,
    description: string,
    details: Record<string, any>,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<OrderLog> {
    const log = this.orderLogRepository.create({
      orderId,
      action,
      description,
      details,
      operatorId,
      operatorName,
      operatorRole,
    });

    return this.orderLogRepository.save(log);
  }
}
