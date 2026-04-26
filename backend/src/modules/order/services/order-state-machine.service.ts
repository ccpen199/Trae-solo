import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus, Role, LogAction } from '../../common/enums';
import { CreateOrderDto, UpdateOrderDto, PrepayOrderDto, ReportActualWeightDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class OrderStateMachine {
  private readonly transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING_PREPAYMENT, OrderStatus.CANCELLED],
    [OrderStatus.PENDING_PREPAYMENT]: [OrderStatus.PREPAYMENT_PAID, OrderStatus.CANCELLED],
    [OrderStatus.PREPAYMENT_PAID]: [OrderStatus.IN_COLLECTION, OrderStatus.CANCELLED],
    [OrderStatus.IN_COLLECTION]: [OrderStatus.QUALITY_CHECKED, OrderStatus.CANCELLED],
    [OrderStatus.QUALITY_CHECKED]: [OrderStatus.IN_TRANSPORT, OrderStatus.CANCELLED],
    [OrderStatus.IN_TRANSPORT]: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION_HANDLING],
    [OrderStatus.DELIVERED]: [OrderStatus.SETTLED, OrderStatus.STORAGE_TRANSFERRED],
    [OrderStatus.SETTLED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.EXCEPTION_HANDLING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.STORAGE_TRANSFERRED]: [],
  };

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowedTransitions = this.transitions[from] || [];
    return allowedTransitions.includes(to);
  }

  validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `无法将订单状态从 ${from} 转换为 ${to}`
      );
    }
  }
}
