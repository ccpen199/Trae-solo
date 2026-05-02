import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { orderId },
      include: {
        order: {
          include: {
            demand: {
              include: {
                farmer: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
            operator: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    return settlement;
  }

  async findAll(
    userId?: string,
    userRole?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (userRole === 'FARMER') {
      const farmerOrders = await this.prisma.order.findMany({
        where: {
          demand: { farmerId: userId },
        },
        select: { id: true },
      });
      where.orderId = { in: farmerOrders.map((o) => o.id) };
    } else if (userRole === 'MACHINERY_OPERATOR') {
      const operatorOrders = await this.prisma.order.findMany({
        where: { operatorId: userId },
        select: { id: true },
      });
      where.orderId = { in: operatorOrders.map((o) => o.id) };
    }

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            include: {
              demand: {
                include: {
                  farmer: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
              operator: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByFarmer(farmerId: string, page: number = 1, pageSize: number = 20) {
    const farmerOrders = await this.prisma.order.findMany({
      where: {
        demand: { farmerId },
      },
      select: { id: true },
    });

    const where = {
      orderId: { in: farmerOrders.map((o) => o.id) },
    };

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            include: {
              demand: {
                include: {
                  farmer: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
              operator: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByOperator(operatorId: string, page: number = 1, pageSize: number = 20) {
    const operatorOrders = await this.prisma.order.findMany({
      where: { operatorId },
      select: { id: true },
    });

    const where = {
      orderId: { in: operatorOrders.map((o) => o.id) },
    };

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            include: {
              demand: {
                include: {
                  farmer: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
              operator: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            demand: {
              include: {
                farmer: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
            operator: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException('结算单不存在');
    }

    // 权限检查
    if (
      userRole === 'FARMER' && settlement.order.demand.farmer.id !== userId ||
      userRole === 'MACHINERY_OPERATOR' && settlement.order.operator.id !== userId
    ) {
      throw new NotFoundException('结算单不存在');
    }

    return settlement;
  }

  async getSummary(userId: string, userRole: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (userRole === 'FARMER') {
      const farmerOrders = await this.prisma.order.findMany({
        where: {
          demand: { farmerId: userId },
        },
        select: { id: true },
      });
      where.orderId = { in: farmerOrders.map((o) => o.id) };
    } else if (userRole === 'MACHINERY_OPERATOR') {
      const operatorOrders = await this.prisma.order.findMany({
        where: { operatorId: userId },
        select: { id: true },
      });
      where.orderId = { in: operatorOrders.map((o) => o.id) };
    }

    const settlements = await this.prisma.settlement.findMany({ where });

    const summary = {
      totalSettlements: settlements.length,
      totalAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
      totalPlatformFee: settlements.reduce((sum, s) => sum + s.platformFee, 0),
      totalOperatorAmount: settlements.reduce((sum, s) => sum + s.operatorAmount, 0),
    };

    return summary;
  }
}
