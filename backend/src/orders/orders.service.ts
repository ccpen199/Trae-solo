import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderLog } from '../entities/order-log.entity';
import { Table } from '../../tables/entities/table.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { OrderStatus, OrderType, OrderSource, OrderItemStatus, OrderLogAction, TableStatus, MenuItemStatus } from '../../common/types';
import { OrderFlowEngine } from '../engines/order-flow.engine';
import { KitchenPrintEngine } from '../engines/kitchen-print.engine';
import { WebSocketGatewayService } from '../../websocket/websocket-gateway.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrderItem {
  menuItemId: string;
  quantity: number;
  specifications?: string;
  customerRemarks?: string;
}

export interface CreateOrderRequest {
  tableId?: string;
  orderType: OrderType;
  guestCount?: number;
  items: CreateOrderItem[];
  customerRemarks?: string;
  customerInfo?: {
    name: string;
    phone: string;
    address?: string;
  };
  source?: OrderSource;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderLog)
    private orderLogRepository: Repository<OrderLog>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    private readonly orderFlowEngine: OrderFlowEngine,
    private readonly kitchenPrintEngine: KitchenPrintEngine,
    private readonly webSocketService: WebSocketGatewayService,
  ) {}

  async createOrder(
    request: CreateOrderRequest,
    createdBy: string,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (request.items.length === 0) {
        throw new Error('订单至少需要包含一个菜品');
      }

      const menuItems = await this.menuItemRepository.findByIds(
        request.items.map((item) => item.menuItemId),
      );

      const menuItemMap = new Map(
        menuItems.map((item) => [item.id, item]),
      );

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const itemRequest of request.items) {
        const menuItem = menuItemMap.get(itemRequest.menuItemId);

        if (!menuItem) {
          throw new Error(`菜品不存在: ${itemRequest.menuItemId}`);
        }

        if (menuItem.status === MenuItemStatus.SOLD_OUT) {
          throw new Error(`菜品已售罄: ${menuItem.name}`);
        }

        if (menuItem.status === MenuItemStatus.DISCONTINUED) {
          throw new Error(`菜品已下架: ${menuItem.name}`);
        }

        const subtotal = menuItem.price * itemRequest.quantity;
        totalAmount += subtotal;

        const orderItem = this.orderItemRepository.create({
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: itemRequest.quantity,
          subtotal,
          discountAmount: 0,
          specifications: itemRequest.specifications,
          customerRemarks: itemRequest.customerRemarks,
          status: OrderItemStatus.PENDING,
          sortOrder: orderItems.length,
        });

        orderItems.push(orderItem);
      }

      const discountAmount = 0;
      const payableAmount = totalAmount - discountAmount;

      const orderNumber = this.generateOrderNumber();

      const order = this.orderRepository.create({
        orderNumber,
        orderType: request.orderType,
        status: OrderStatus.PENDING,
        source: request.source || OrderSource.SCAN,
        totalAmount,
        discountAmount,
        payableAmount,
        paidAmount: 0,
        guestCount: request.guestCount || 1,
        customerRemarks: request.customerRemarks,
        customerInfo: request.customerInfo,
        tableId: request.tableId,
        createdBy,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(Order, order) as Order;

      for (const orderItem of orderItems) {
        orderItem.orderId = savedOrder.id;
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      const log = this.orderLogRepository.create({
        orderId: savedOrder.id,
        action: OrderLogAction.CREATED,
        description: '订单创建成功',
        details: {
          orderType: request.orderType,
          itemCount: orderItems.length,
          totalAmount,
        },
        operatorId: createdBy,
      });

      await queryRunner.manager.save(OrderLog, log);

      if (request.tableId) {
        const table = await queryRunner.manager.findOne(Table, {
          where: { id: request.tableId },
        }) as Table | null;

        if (table) {
          if (table.status !== TableStatus.OCCUPIED) {
            table.status = TableStatus.OCCUPIED;
          }
          table.currentOrderId = savedOrder.id;
          await queryRunner.manager.save(Table, table);
        }
      }

      await queryRunner.commitTransaction();

      this.webSocketService.notifyNewOrder({
        id: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        status: savedOrder.status,
        orderType: savedOrder.orderType,
        tableId: savedOrder.tableId,
      });

      await this.kitchenPrintEngine.printKitchenTicket(
        savedOrder.id,
        'new',
        createdBy,
      );

      this.logger.log(`订单创建成功: ${savedOrder.orderNumber}`);

      return this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'table', 'logs'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`订单创建失败: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'table', 'payments', 'logs'],
    });
  }

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'table', 'payments', 'logs'],
    });
  }

  async getOrders(
    filters?: {
      status?: OrderStatus;
      orderType?: OrderType;
      tableId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Order[]; total: number }> {
    const { page = 1, limit = 20 } = pagination || {};
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    queryBuilder.leftJoinAndSelect('order.items', 'items');
    queryBuilder.leftJoinAndSelect('order.table', 'table');

    if (filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.orderType) {
      queryBuilder.andWhere('order.orderType = :orderType', { orderType: filters.orderType });
    }

    if (filters?.tableId) {
      queryBuilder.andWhere('order.tableId = :tableId', { tableId: filters.tableId });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async addItems(
    orderId: string,
    items: CreateOrderItem[],
    operatorId: string,
    operatorName: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.COMPLETED
    ) {
      throw new Error(`订单状态不允许加菜: ${order.status}`);
    }

    const menuItems = await this.menuItemRepository.findByIds(
      items.map((item) => item.menuItemId),
    );

    const menuItemMap = new Map(
      menuItems.map((item) => [item.id, item]),
    );

    let addedTotal = 0;
    const newOrderItems: OrderItem[] = [];

    for (const itemRequest of items) {
      const menuItem = menuItemMap.get(itemRequest.menuItemId);

      if (!menuItem) {
        throw new Error(`菜品不存在: ${itemRequest.menuItemId}`);
      }

      if (menuItem.status !== MenuItemStatus.AVAILABLE) {
        throw new Error(`菜品不可用: ${menuItem.name}`);
      }

      const subtotal = menuItem.price * itemRequest.quantity;
      addedTotal += subtotal;

      const orderItem = this.orderItemRepository.create({
        orderId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: itemRequest.quantity,
        subtotal,
        discountAmount: 0,
        specifications: itemRequest.specifications,
        customerRemarks: itemRequest.customerRemarks,
        status: OrderItemStatus.PENDING,
        sortOrder: order.items.length + newOrderItems.length,
      });

      newOrderItems.push(orderItem);
    }

    for (const orderItem of newOrderItems) {
      await this.orderItemRepository.save(orderItem);
    }

    order.totalAmount = order.totalAmount + addedTotal;
    order.payableAmount = order.payableAmount + addedTotal;

    await this.orderRepository.save(order);

    await this.createOrderLog(
      orderId,
      OrderLogAction.ITEM_ADDED,
      `加菜成功，共 ${newOrderItems.length} 个菜品，金额 ¥${addedTotal.toFixed(2)}`,
      {
        itemCount: newOrderItems.length,
        addedTotal,
        items: newOrderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      operatorId,
      operatorName,
    );

    await this.kitchenPrintEngine.printKitchenTicket(
      orderId,
      'add',
      operatorId,
      operatorName,
    );

    this.logger.log(`订单 ${order.orderNumber} 加菜成功`);

    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'table'],
    });
  }

  async cancelItem(
    orderItemId: string,
    operatorId: string,
    operatorName: string,
    reason?: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order'],
    });

    if (!orderItem) {
      throw new Error(`订单项不存在: ${orderItemId}`);
    }

    if (
      orderItem.status === OrderItemStatus.CANCELLED ||
      orderItem.status === OrderItemStatus.REFUNDED
    ) {
      throw new Error(`该菜品已被退菜`);
    }

    if (orderItem.status === OrderItemStatus.SERVED) {
      throw new Error(`已上菜的菜品不能退菜`);
    }

    orderItem.status = OrderItemStatus.CANCELLED;

    await this.orderItemRepository.save(orderItem);

    if (orderItem.order) {
      orderItem.order.totalAmount = orderItem.order.totalAmount - orderItem.subtotal;
      orderItem.order.payableAmount = orderItem.order.payableAmount - orderItem.subtotal;
      await this.orderRepository.save(orderItem.order);
    }

    await this.createOrderLog(
      orderItem.orderId,
      OrderLogAction.ITEM_REMOVED,
      `退菜: ${orderItem.name} x${orderItem.quantity}，原因: ${reason || '未说明'}`,
      {
        orderItemId: orderItem.id,
        itemName: orderItem.name,
        quantity: orderItem.quantity,
        price: orderItem.price,
        reason,
      },
      operatorId,
      operatorName,
    );

    await this.kitchenPrintEngine.printKitchenTicket(
      orderItem.orderId,
      'cancel',
      operatorId,
      operatorName,
    );

    this.logger.log(`退菜成功: ${orderItem.name} x${orderItem.quantity}`);

    return orderItem;
  }

  async confirmOrder(
    orderId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<Order> {
    return this.orderFlowEngine.transitionOrder(
      orderId,
      OrderStatus.CONFIRMED,
      operatorId,
      operatorName,
      operatorRole,
    );
  }

  async startPreparing(
    orderId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<Order> {
    return this.orderFlowEngine.transitionOrder(
      orderId,
      OrderStatus.PREPARING,
      operatorId,
      operatorName,
      operatorRole,
    );
  }

  async markOrderReady(
    orderId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<Order> {
    const allReady = await this.orderFlowEngine.canAllItemsComplete(
      orderId,
      OrderItemStatus.READY,
    );

    if (!allReady) {
      throw new Error('还有菜品未准备完成');
    }

    return this.orderFlowEngine.transitionOrder(
      orderId,
      OrderStatus.READY,
      operatorId,
      operatorName,
      operatorRole,
    );
  }

  async markOrderServed(
    orderId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<Order> {
    return this.orderFlowEngine.transitionOrder(
      orderId,
      OrderStatus.SERVED,
      operatorId,
      operatorName,
      operatorRole,
    );
  }

  async markOrderItemPreparing(
    orderItemId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderFlowEngine.transitionOrderItem(
      orderItemId,
      OrderItemStatus.PREPARING,
      operatorId,
      operatorName,
      operatorRole,
    );

    await this.orderFlowEngine.autoTransitionOrderIfAllItemsComplete(
      orderItem.orderId,
      OrderItemStatus.PREPARING,
      OrderStatus.PREPARING,
      operatorId,
      operatorName,
      operatorRole,
    );

    return orderItem;
  }

  async markOrderItemReady(
    orderItemId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderFlowEngine.transitionOrderItem(
      orderItemId,
      OrderItemStatus.READY,
      operatorId,
      operatorName,
      operatorRole,
    );

    await this.orderFlowEngine.autoTransitionOrderIfAllItemsComplete(
      orderItem.orderId,
      OrderItemStatus.READY,
      OrderStatus.READY,
      operatorId,
      operatorName,
      operatorRole,
    );

    return orderItem;
  }

  async markOrderItemServed(
    orderItemId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderFlowEngine.transitionOrderItem(
      orderItemId,
      OrderItemStatus.SERVED,
      operatorId,
      operatorName,
      operatorRole,
    );

    await this.orderFlowEngine.autoTransitionOrderIfAllItemsComplete(
      orderItem.orderId,
      OrderItemStatus.SERVED,
      OrderStatus.SERVED,
      operatorId,
      operatorName,
      operatorRole,
    );

    return orderItem;
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `O${year}${month}${day}${random}`;
  }

  private async createOrderLog(
    orderId: string,
    action: OrderLogAction,
    description: string,
    details: Record<string, any>,
    operatorId: string,
    operatorName: string,
  ): Promise<OrderLog> {
    const log = this.orderLogRepository.create({
      orderId,
      action,
      description,
      details,
      operatorId,
      operatorName,
    });

    return this.orderLogRepository.save(log);
  }
}
