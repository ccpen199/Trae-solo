import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KitchenTicket,
  OrderStatus,
  OrderType,
  OrderItemStatus,
  TableStatus,
  PaymentMethod,
  OrderNotification,
  OrderItemNotification,
  TableNotification,
  PaymentNotification,
} from '../common/types';

export interface WebSocketClient {
  id: string;
  role: string;
  userId?: string;
  tableId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);
  private connectedClients: Map<string, WebSocketClient> = new Map();

  constructor(private readonly configService: ConfigService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway 已初始化');
  }

  async handleConnection(client: Socket) {
    const { role, userId, tableId } = client.handshake.query;

    const clientInfo: WebSocketClient = {
      id: client.id,
      role: Array.isArray(role) ? role[0] : role || 'guest',
      userId: Array.isArray(userId) ? userId[0] : userId,
      tableId: Array.isArray(tableId) ? tableId[0] : tableId,
    };

    this.connectedClients.set(client.id, clientInfo);

    if (clientInfo.role) {
      client.join(`role:${clientInfo.role}`);
    }

    if (clientInfo.tableId) {
      client.join(`table:${clientInfo.tableId}`);
    }

    this.logger.log(
      `客户端连接: ${client.id} (角色: ${clientInfo.role}, 用户ID: ${clientInfo.userId}, 桌台ID: ${clientInfo.tableId})`,
    );

    client.emit('connected', {
      id: client.id,
      message: 'WebSocket 连接成功',
    });
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);

    this.logger.log(
      `客户端断开: ${client.id} (角色: ${clientInfo?.role || 'unknown'})`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data: { timestamp: Date.now(), ...data } };
  }

  @SubscribeMessage('subscribe:role')
  handleSubscribeRole(client: Socket, role: string) {
    client.join(`role:${role}`);
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.role = role;
    }
    this.logger.log(`客户端 ${client.id} 订阅角色: ${role}`);
  }

  @SubscribeMessage('subscribe:table')
  handleSubscribeTable(client: Socket, tableId: string) {
    client.join(`table:${tableId}`);
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.tableId = tableId;
    }
    this.logger.log(`客户端 ${client.id} 订阅桌台: ${tableId}`);
  }

  notifyOrderStatusChange(order: OrderNotification) {
    this.server.to('role:cashier').to('role:waiter').to('role:manager').to('role:admin').emit('order:statusChanged', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      timestamp: Date.now(),
    });

    if (order.tableId) {
      this.server.to(`table:${order.tableId}`).emit('order:customerStatusChanged', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        timestamp: Date.now(),
      });
    }

    this.logger.log(`订单状态变更通知: ${order.orderNumber} -> ${order.status}`);
  }

  notifyOrderItemStatusChange(orderId: string, orderItem: OrderItemNotification) {
    this.server.to('role:chef').to('role:waiter').emit('orderItem:statusChanged', {
      orderId,
      itemId: orderItem.id,
      itemName: orderItem.name,
      status: orderItem.status,
      timestamp: Date.now(),
    });

    this.logger.log(`订单项状态变更通知: ${orderItem.name} -> ${orderItem.status}`);
  }

  notifyNewOrder(order: OrderNotification) {
    this.server.to('role:cashier').to('role:chef').to('role:waiter').emit('order:new', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableId: order.tableId,
      timestamp: Date.now(),
    });

    this.logger.log(`新订单通知: ${order.orderNumber}`);
  }

  notifyTableStatusChange(table: TableNotification) {
    this.server.to('role:cashier').to('role:waiter').to('role:manager').to('role:admin').emit('table:statusChanged', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      status: table.status,
      timestamp: Date.now(),
    });

    this.logger.log(`桌台状态变更通知: ${table.tableNumber} -> ${table.status}`);
  }

  notifyPaymentComplete(orderId: string, payment: PaymentNotification) {
    this.server.to('role:cashier').to('role:manager').emit('payment:complete', {
      orderId,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      method: payment.method,
      timestamp: Date.now(),
    });

    this.logger.log(`支付完成通知: ${payment.paymentNumber} -> ¥${payment.amount}`);
  }

  notifyPrintComplete(orderId: string, printerType: string, ticket: KitchenTicket) {
    this.server.to('role:chef').to('role:cashier').emit('print:complete', {
      orderId,
      printerType,
      orderNumber: ticket.orderNumber,
      itemCount: ticket.items.length,
      timestamp: Date.now(),
    });

    this.logger.log(`打印完成通知: 订单 ${ticket.orderNumber}`);
  }

  notifyCallNumber(orderId: string, orderNumber: string, callNumber: string) {
    this.server.to('role:waiter').to('role:cashier').emit('order:callNumber', {
      orderId,
      orderNumber,
      callNumber,
      timestamp: Date.now(),
    });

    this.logger.log(`叫号通知: ${orderNumber} -> ${callNumber}`);
  }

  getConnectedClients(): WebSocketClient[] {
    return Array.from(this.connectedClients.values());
  }

  getClientCountByRole(role: string): number {
    let count = 0;
    this.connectedClients.forEach((client) => {
      if (client.role === role) {
        count++;
      }
    });
    return count;
  }
}
