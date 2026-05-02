import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderLog } from '../entities/order-log.entity';
import { OrderType, OrderItemStatus, OrderLogAction } from '../../common/types';
import { WebSocketGatewayService } from '../../websocket/websocket-gateway.service';

export interface PrinterConfig {
  type: 'network' | 'usb';
  ip?: string;
  port?: number;
  vendorId?: string;
  productId?: string;
}

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  tableNumber: string;
  orderType: OrderType;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specifications: string;
    remarks: string;
  }>;
  customerRemarks: string;
  createdAt: Date;
  printedAt: Date;
}

@Injectable()
export class KitchenPrintEngine {
  private readonly logger = new Logger(KitchenPrintEngine.name);

  private kitchenPrinterConfig: PrinterConfig;
  private cashierPrinterConfig: PrinterConfig;
  private isMockMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderLog)
    private orderLogRepository: Repository<OrderLog>,
    private readonly webSocketService: WebSocketGatewayService,
  ) {
    const printerType = this.configService.get<string>('PRINTER_TYPE', 'network') as 'network' | 'usb';
    
    this.kitchenPrinterConfig = {
      type: printerType,
      ip: this.configService.get<string>('KITCHEN_PRINTER_IP'),
      port: this.configService.get<number>('KITCHEN_PRINTER_PORT', 9100),
    };

    this.cashierPrinterConfig = {
      type: printerType,
      ip: this.configService.get<string>('CASHIER_PRINTER_IP'),
      port: this.configService.get<number>('CASHIER_PRINTER_PORT', 9100),
    };

    this.isMockMode = this.configService.get<string>('NODE_ENV') === 'development';
    if (this.isMockMode) {
      this.logger.log('打印服务运行在模拟模式，将不会实际打印');
    }
  }

  async printKitchenTicket(
    orderId: string,
    printType: 'new' | 'add' | 'cancel' = 'new',
    operatorId?: string,
    operatorName?: string,
  ): Promise<KitchenTicket> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'table'],
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const itemsToPrint = this.getItemsToPrint(order.items, printType);

    if (itemsToPrint.length === 0) {
      this.logger.log(`订单 ${order.orderNumber} 没有需要打印的项目`);
      return null;
    }

    const ticket: KitchenTicket = {
      id: `${order.id}-${Date.now()}`,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.tableNumber || this.getOrderTypeLabel(order.orderType),
      orderType: order.orderType,
      items: itemsToPrint.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        specifications: item.specifications,
        remarks: item.customerRemarks,
      })),
      customerRemarks: order.customerRemarks,
      createdAt: order.createdAt,
      printedAt: new Date(),
    };

    if (this.isMockMode) {
      this.logger.log(`[模拟打印] 后厨小票: \n${this.formatKitchenTicket(ticket, printType)}`);
    } else {
      await this.sendToPrinter(this.kitchenPrinterConfig, this.formatKitchenTicket(ticket, printType));
    }

    for (const item of itemsToPrint) {
      item.printedAt = new Date();
      item.printId = ticket.id;
      await this.orderRepository.manager.save(OrderItem, item);
    }

    await this.createPrintLog(orderId, ticket, printType, operatorId, operatorName);

    this.webSocketService.notifyPrintComplete(orderId, 'kitchen', ticket);

    this.logger.log(`订单 ${order.orderNumber} 后厨小票打印完成`);

    return ticket;
  }

  async printCashierReceipt(orderId: string, operatorId?: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'table', 'payments'],
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const receiptContent = this.formatCashierReceipt(order);

    if (this.isMockMode) {
      this.logger.log(`[模拟打印] 收银小票: \n${receiptContent}`);
    } else {
      await this.sendToPrinter(this.cashierPrinterConfig, receiptContent);
    }

    this.logger.log(`订单 ${order.orderNumber} 收银小票打印完成`);
  }

  private getItemsToPrint(
    items: OrderItem[],
    printType: string,
  ): OrderItem[] {
    switch (printType) {
      case 'new':
        return items.filter(
          (item) =>
            !item.printedAt &&
            item.status !== OrderItemStatus.CANCELLED &&
            item.status !== OrderItemStatus.REFUNDED,
        );
      case 'add':
        return items.filter(
          (item) =>
            !item.printedAt &&
            item.status !== OrderItemStatus.CANCELLED &&
            item.status !== OrderItemStatus.REFUNDED,
        );
      case 'cancel':
        return items.filter(
          (item) =>
            item.status === OrderItemStatus.CANCELLED ||
            item.status === OrderItemStatus.REFUNDED,
        );
      default:
        return [];
    }
  }

  private formatKitchenTicket(ticket: KitchenTicket, printType: string): string {
    const typeLabels: Record<string, string> = {
      new: '新订单',
      add: '加菜',
      cancel: '退菜',
    };

    let content = `\n`;
    content += `================================\n`;
    content += `         【${typeLabels[printType]}】\n`;
    content += `================================\n`;
    content += `订单号: ${ticket.orderNumber}\n`;
    content += `桌号: ${ticket.tableNumber}\n`;
    content += `时间: ${this.formatDateTime(ticket.createdAt)}\n`;
    content += `--------------------------------\n\n`;

    for (const item of ticket.items) {
      content += `${item.name} x${item.quantity}\n`;
      if (item.specifications) {
        content += `  规格: ${item.specifications}\n`;
      }
      if (item.remarks) {
        content += `  备注: ${item.remarks}\n`;
      }
      content += `\n`;
    }

    if (ticket.customerRemarks) {
      content += `--------------------------------\n`;
      content += `客户备注: ${ticket.customerRemarks}\n`;
    }

    content += `================================\n`;
    content += `打印时间: ${this.formatDateTime(ticket.printedAt)}\n`;
    content += `\n\n\n`;

    return content;
  }

  private formatCashierReceipt(order: Order): string {
    let content = `\n`;
    content += `================================\n`;
    content += `         收银小票\n`;
    content += `================================\n`;
    content += `订单号: ${order.orderNumber}\n`;
    content += `桌号: ${order.table?.tableNumber || this.getOrderTypeLabel(order.orderType)}\n`;
    content += `开单时间: ${this.formatDateTime(order.createdAt)}\n`;
    content += `--------------------------------\n\n`;

    for (const item of order.items) {
      if (item.status === OrderItemStatus.CANCELLED || item.status === OrderItemStatus.REFUNDED) {
        continue;
      }
      content += `${item.name} x${item.quantity}  ¥${item.price.toFixed(2)}\n`;
      if (item.specifications) {
        content += `  规格: ${item.specifications}\n`;
      }
    }

    content += `\n--------------------------------\n`;
    content += `金额合计:     ¥${order.totalAmount.toFixed(2)}\n`;
    content += `优惠金额:     ¥${order.discountAmount.toFixed(2)}\n`;
    content += `应付金额:     ¥${order.payableAmount.toFixed(2)}\n`;
    content += `实付金额:     ¥${order.paidAmount.toFixed(2)}\n`;

    if (order.payments && order.payments.length > 0) {
      content += `--------------------------------\n`;
      content += `支付方式:\n`;
      for (const payment of order.payments) {
        const methodLabels: Record<string, string> = {
          cash: '现金',
          wechat: '微信支付',
          alipay: '支付宝',
          card: '银行卡',
          member: '会员余额',
        };
        content += `  ${methodLabels[payment.method] || payment.method}: ¥${payment.amount.toFixed(2)}\n`;
      }
    }

    content += `================================\n`;
    content += `欢迎下次光临！\n`;
    content += `\n\n\n`;

    return content;
  }

  private async sendToPrinter(config: PrinterConfig, content: string): Promise<void> {
    if (config.type === 'network' && config.ip) {
      const net = require('net');
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect(config.port || 9100, config.ip, () => {
          client.write(content, 'utf8', () => {
            client.destroy();
            resolve();
          });
        });
        client.on('error', (err) => {
          client.destroy();
          reject(err);
        });
      });
    } else {
      this.logger.warn('不支持的打印机类型或配置');
    }
  }

  private async createPrintLog(
    orderId: string,
    ticket: KitchenTicket,
    printType: string,
    operatorId: string,
    operatorName: string,
  ): Promise<OrderLog> {
    const log = this.orderLogRepository.create({
      orderId,
      action: OrderLogAction.PRINTED,
      description: `打印后厨小票 [${printType}]`,
      details: {
        printType,
        ticketId: ticket.id,
        itemCount: ticket.items.length,
      },
      operatorId,
      operatorName,
    });

    return this.orderLogRepository.save(log);
  }

  private getOrderTypeLabel(orderType: OrderType): string {
    const labels: Record<OrderType, string> = {
      [OrderType.DINE_IN]: '堂食',
      [OrderType.TAKEAWAY]: '打包',
      [OrderType.DELIVERY]: '外卖',
    };
    return labels[orderType];
  }

  private formatDateTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }
}
