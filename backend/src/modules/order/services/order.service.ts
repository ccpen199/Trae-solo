import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus, Role, LogAction } from '../../common/enums';
import { CreateOrderDto, UpdateOrderDto, PrepayOrderDto, ReportActualWeightDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { OrderStateMachine } from './order-state-machine.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: OrderStateMachine,
  ) {}

  async generateOrderNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });

    return `ORD${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }

  async generateSubOrderNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    
    const count = await this.prisma.subOrder.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });

    return `SUB${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }

  async create(buyerId: string, createOrderDto: CreateOrderDto) {
    const orderNo = await this.generateOrderNo();
    const expectedAmount = createOrderDto.expectedWeight * createOrderDto.expectedPrice;

    const order = await this.prisma.$transaction(async (prisma) => {
      const mainOrder = await prisma.order.create({
        data: {
          orderNo,
          buyerId,
          status: OrderStatus.PENDING_PREPAYMENT,
          productName: createOrderDto.productName,
          productCategory: createOrderDto.productCategory,
          expectedWeight: createOrderDto.expectedWeight,
          expectedPrice: createOrderDto.expectedPrice,
          expectedAmount,
          originProvince: createOrderDto.originProvince,
          originCity: createOrderDto.originCity,
          originDistrict: createOrderDto.originDistrict,
          originDetail: createOrderDto.originDetail,
          destinationProvince: createOrderDto.destinationProvince,
          destinationCity: createOrderDto.destinationCity,
          destinationDistrict: createOrderDto.destinationDistrict,
          destinationDetail: createOrderDto.destinationDetail,
          expectedPickupDate: createOrderDto.expectedPickupDate ? new Date(createOrderDto.expectedPickupDate) : null,
          expectedDeliveryDate: createOrderDto.expectedDeliveryDate ? new Date(createOrderDto.expectedDeliveryDate) : null,
          toleranceRate: createOrderDto.toleranceRate || 0.05,
          hasColdChain: createOrderDto.hasColdChain || false,
          qualityStandard: createOrderDto.qualityStandard,
          remark: createOrderDto.remark,
        },
      });

      if (createOrderDto.farmerAllocations && createOrderDto.farmerAllocations.length > 0) {
        for (const allocation of createOrderDto.farmerAllocations) {
          const subOrderNo = await this.generateSubOrderNo();
          await prisma.subOrder.create({
            data: {
              subOrderNo,
              mainOrderId: mainOrder.id,
              farmerId: allocation.farmerId,
              status: OrderStatus.PENDING_PREPAYMENT,
              productName: createOrderDto.productName,
              expectedWeight: allocation.expectedWeight,
              expectedPrice: allocation.expectedPrice,
              expectedAmount: allocation.expectedWeight * allocation.expectedPrice,
              farmProvince: allocation.farmProvince,
              farmCity: allocation.farmCity,
              farmDistrict: allocation.farmDistrict,
              farmDetail: allocation.farmDetail,
            },
          });
        }
      }

      return mainOrder;
    });

    return this.findOne(order.id);
  }

  async findAll(userId: string, role: Role, status?: OrderStatus) {
    let where: any = {};

    if (role === Role.BUYER) {
      where.buyerId = userId;
    } else if (role === Role.FARMER) {
      where.subOrders = {
        some: { farmerId: userId }
      };
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        subOrders: {
          include: {
            farmer: {
              omit: { password: true }
            }
          }
        },
        buyer: {
          omit: { password: true }
        },
        qualityChecks: true,
        settlements: true,
        coldChainRecords: {
          orderBy: { recordTime: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        subOrders: {
          include: {
            farmer: {
              omit: { password: true }
            },
            qualityChecks: true,
            settlements: true,
          }
        },
        buyer: {
          omit: { password: true },
          include: { virtualAccount: true }
        },
        qualityChecks: true,
        settlements: {
          orderBy: { createdAt: 'desc' }
        },
        coldChainRecords: {
          orderBy: { recordTime: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string) {
    const order = await this.findOne(id);

    if (order.buyerId !== userId) {
      throw new ForbiddenException('无权修改此订单');
    }

    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING_PREPAYMENT) {
      throw new BadRequestException('订单当前状态不可修改');
    }

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async cancel(id: string, userId: string, role: Role, remark?: string) {
    const order = await this.findOne(id);

    if (role === Role.BUYER && order.buyerId !== userId) {
      throw new ForbiddenException('无权取消此订单');
    }

    this.stateMachine.validateTransition(order.status, OrderStatus.CANCELLED);

    return this.prisma.$transaction(async (prisma) => {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          remark: remark ? `${order.remark || ''}\n取消原因: ${remark}` : order.remark,
        },
      });

      await prisma.subOrder.updateMany({
        where: { mainOrderId: id },
        data: { status: OrderStatus.CANCELLED },
      });

      return updatedOrder;
    });
  }

  async prepay(id: string, prepayDto: PrepayOrderDto, userId: string) {
    const order = await this.findOne(id);

    if (order.buyerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    this.stateMachine.validateTransition(order.status, OrderStatus.PREPAYMENT_PAID);

    const virtualAccount = await this.prisma.virtualAccount.findUnique({
      where: { userId },
    });

    if (!virtualAccount) {
      throw new NotFoundException('账户不存在');
    }

    if (virtualAccount.balance < prepayDto.amount) {
      throw new BadRequestException('账户余额不足');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.virtualAccount.update({
        where: { userId },
        data: {
          balance: { decrement: prepayDto.amount },
          frozenAmount: { increment: prepayDto.amount },
        },
      });

      await prisma.accountTransaction.create({
        data: {
          accountId: virtualAccount.id,
          amount: -prepayDto.amount,
          type: 'PREPAYMENT_FREEZE',
          status: 'COMPLETED',
          referenceId: id,
          description: `订单 ${order.orderNo} 预付款冻结`,
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.PREPAYMENT_PAID,
          prepaidAmount: { increment: prepayDto.amount },
        },
      });

      await prisma.subOrder.updateMany({
        where: { mainOrderId: id },
        data: {
          status: OrderStatus.PREPAYMENT_PAID,
          prepaidAmount: { increment: prepayDto.amount / order.subOrders.length },
        },
      });

      return updatedOrder;
    });
  }

  async reportActualWeight(
    subOrderId: string,
    reportDto: ReportActualWeightDto,
    userId: string,
    role: Role
  ) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { mainOrder: true },
    });

    if (!subOrder) {
      throw new NotFoundException('子订单不存在');
    }

    if (role === Role.FARMER && subOrder.farmerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    this.stateMachine.validateTransition(subOrder.status, OrderStatus.IN_COLLECTION);

    return this.prisma.$transaction(async (prisma) => {
      const updatedSubOrder = await prisma.subOrder.update({
        where: { id: subOrderId },
        data: {
          status: OrderStatus.IN_COLLECTION,
          actualWeight: reportDto.actualWeight,
          remark: reportDto.remark,
        },
      });

      const allSubOrders = await prisma.subOrder.findMany({
        where: { mainOrderId: subOrder.mainOrderId },
      });

      const allInCollection = allSubOrders.every(so => 
        so.status === OrderStatus.IN_COLLECTION || 
        so.status === OrderStatus.QUALITY_CHECKED
      );

      if (allInCollection) {
        const totalActualWeight = allSubOrders.reduce((sum, so) => 
          sum + (so.actualWeight || 0), 0
        );

        await prisma.order.update({
          where: { id: subOrder.mainOrderId },
          data: {
            status: OrderStatus.IN_COLLECTION,
            actualWeight: totalActualWeight,
          },
        });
      }

      return updatedSubOrder;
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId: string,
    role: Role
  ) {
    const order = await this.findOne(id);

    this.stateMachine.validateTransition(order.status, updateStatusDto.status);

    if (role === Role.BUYER && order.buyerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (role === Role.FARMER) {
      const farmerSubOrder = order.subOrders.find(so => so.farmerId === userId);
      if (!farmerSubOrder) {
        throw new ForbiddenException('无权操作此订单');
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
        remark: updateStatusDto.remark,
      },
    });
  }

  async getSubOrder(subOrderId: string) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        mainOrder: true,
        farmer: { omit: { password: true } },
        qualityChecks: true,
        settlements: true,
      },
    });

    if (!subOrder) {
      throw new NotFoundException('子订单不存在');
    }

    return subOrder;
  }

  async getMySubOrders(farmerId: string, status?: OrderStatus) {
    const where: any = { farmerId };
    if (status) {
      where.status = status;
    }

    return this.prisma.subOrder.findMany({
      where,
      include: {
        mainOrder: {
          include: {
            buyer: { omit: { password: true } }
          }
        },
        qualityChecks: true,
        settlements: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
