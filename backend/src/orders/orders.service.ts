import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StateMachineService } from '../state-machine/state-machine.service';
import { TrackVerifyEngineService } from '../engines/track-verify/track-verify-engine.service';
import { BillingEngineService } from '../engines/billing/billing-engine.service';
import { CreditEngineService } from '../engines/credit/credit-engine.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DispatchEngineService } from '../engines/dispatch/dispatch-engine.service';
import { CreateOrderDto, TrackPointDto } from './dto/create-order.dto';
import { OrderStatus, UserRole, BillingMode, DemandStatus, MachineryStatus } from '../types/enums';
import { TransitionContext } from '../state-machine/types/state-machine.types';
import { TrackPoint } from '../engines/track-verify/types/track-verify.types';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stateMachineService: StateMachineService,
    private trackVerifyEngine: TrackVerifyEngineService,
    private billingEngine: BillingEngineService,
    private creditEngine: CreditEngineService,
    private auditLogService: AuditLogService,
    private dispatchEngine: DispatchEngineService,
  ) {}

  async create(
    demandId: string,
    machineryId: string,
    operatorId: string,
    dispatcherId: string | null,
    context: TransitionContext,
  ) {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { farmer: true },
    });

    if (!demand) {
      throw new NotFoundException('需求单不存在');
    }

    if (demand.status !== DemandStatus.MATCHED) {
      throw new BadRequestException('需求单状态不允许派单');
    }

    const machinery = await this.prisma.machinery.findUnique({
      where: { id: machineryId },
    });

    if (!machinery) {
      throw new NotFoundException('农机不存在');
    }

    if (machinery.status !== MachineryStatus.AVAILABLE) {
      throw new BadRequestException('农机不可用');
    }

    const billingMode = demand.billingMode || BillingMode.PER_MU;
    const pricePerUnit = demand.pricePerUnit || 50;
    const estimatedPrice = demand.totalPrice || demand.area * pricePerUnit;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          demandId,
          machineryId,
          operatorId,
          dispatcherId,
          status: OrderStatus.PENDING_ACCEPT,
          billingMode,
          pricePerUnit,
          estimatedArea: demand.area,
          estimatedPrice,
        },
        include: {
          demand: true,
          machinery: true,
          operator: {
            select: { id: true, name: true, phone: true },
          },
          dispatcher: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      await tx.demand.update({
        where: { id: demandId },
        data: { status: DemandStatus.DISPATCHED },
      });

      await tx.machinery.update({
        where: { id: machineryId },
        data: { status: MachineryStatus.IN_USE },
      });

      return newOrder;
    });

    await this.stateMachineService.transitionDemand(
      demandId,
      'dispatch',
      context,
    );

    await this.auditLogService.logCreate('Order', order.id, context, {
      demandId,
      machineryId,
      operatorId,
      dispatcherId,
    });

    return order;
  }

  async findAll(
    userId?: string,
    userRole?: UserRole,
    status?: OrderStatus,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (userRole === UserRole.FARMER) {
      const farmerDemands = await this.prisma.demand.findMany({
        where: { farmerId: userId },
        select: { id: true },
      });
      where.demandId = { in: farmerDemands.map((d) => d.id) };
    } else if (userRole === UserRole.MACHINERY_OPERATOR) {
      where.operatorId = userId;
    } else if (userRole === UserRole.PLATFORM_DISPATCHER) {
      if (userId) {
        where.dispatcherId = userId;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          demand: true,
          machinery: true,
          operator: {
            select: { id: true, name: true, phone: true },
          },
          dispatcher: {
            select: { id: true, name: true, phone: true },
          },
          settlement: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        demand: {
          include: {
            farmer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        machinery: true,
        operator: {
          select: { id: true, name: true, phone: true },
        },
        dispatcher: {
          select: { id: true, name: true, phone: true },
        },
        workTracks: {
          orderBy: { timestamp: 'asc' },
        },
        settlement: true,
        reviews: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (
      userRole === UserRole.MACHINERY_OPERATOR &&
      order.operatorId !== userId
    ) {
      throw new ForbiddenException('无权访问此订单');
    }

    if (userRole === UserRole.FARMER) {
      const demand = await this.prisma.demand.findUnique({
        where: { id: order.demandId },
      });
      if (demand && demand.farmerId !== userId) {
        throw new ForbiddenException('无权访问此订单');
      }
    }

    return order;
  }

  async accept(id: string, operatorId: string, context: TransitionContext) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.PENDING_ACCEPT) {
      throw new BadRequestException('订单状态不允许接受');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'accept',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.ACCEPTED },
    });

    return this.findOne(id);
  }

  async reject(id: string, operatorId: string, context: TransitionContext) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.PENDING_ACCEPT) {
      throw new BadRequestException('订单状态不允许拒绝');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'reject',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.machinery.update({
        where: { id: order.machineryId },
        data: { status: MachineryStatus.AVAILABLE },
      });
    });

    return this.findOne(id);
  }

  async arrive(id: string, operatorId: string, context: TransitionContext) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException('订单状态不允许签到');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'arrive',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.ARRIVED,
        arrivedAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  async startWork(id: string, operatorId: string, context: TransitionContext) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.ARRIVED) {
      throw new BadRequestException('订单状态不允许开始作业');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'start_work',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  async addTrackPoint(
    id: string,
    operatorId: string,
    trackPoint: TrackPointDto,
  ) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('只有进行中的订单才能上传轨迹');
    }

    const track = await this.prisma.workTrack.create({
      data: {
        orderId: id,
        lng: trackPoint.lng,
        lat: trackPoint.lat,
        timestamp: new Date(trackPoint.timestamp),
        speed: trackPoint.speed,
        altitude: trackPoint.altitude,
        accuracy: trackPoint.accuracy,
      },
    });

    return track;
  }

  async complete(id: string, operatorId: string, context: TransitionContext) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('订单状态不允许完成');
    }

    const tracks = await this.prisma.workTrack.findMany({
      where: { orderId: id },
      orderBy: { timestamp: 'asc' },
    });

    if (tracks.length < 3) {
      throw new BadRequestException('作业轨迹数据不足，请确保GPS正常');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'complete',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const verifyTracks: TrackPoint[] = tracks.map((t) => ({
      lng: t.lng,
      lat: t.lat,
      timestamp: t.timestamp,
      speed: t.speed || undefined,
      altitude: t.altitude || undefined,
      accuracy: t.accuracy || undefined,
    }));

    const verifyResult = await this.trackVerifyEngine.verify({
      orderId: id,
      tracks: verifyTracks,
      expectedArea: order.estimatedArea || order.demand.area,
      location: {
        lng: order.demand.locationLng,
        lat: order.demand.locationLat,
      },
    });

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
        actualArea: verifyResult.actualArea,
        actualHours: verifyResult.actualDuration > 0 ? verifyResult.actualDuration / 60 : null,
      },
    });

    return {
      order: await this.findOne(id),
      verifyResult,
    };
  }

  async verify(
    id: string,
    userId: string,
    userRole: UserRole,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, userId, userRole);

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('订单状态不允许验收');
    }

    if (
      userRole !== UserRole.FARMER &&
      userRole !== UserRole.PLATFORM_DISPATCHER
    ) {
      throw new ForbiddenException('只有农户或调度员可以验收');
    }

    if (userRole === UserRole.FARMER) {
      const demand = await this.prisma.demand.findUnique({
        where: { id: order.demandId },
      });
      if (demand && demand.farmerId !== userId) {
        throw new ForbiddenException('只能验收自己的订单');
      }
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'verify',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const actualArea = order.actualArea || order.estimatedArea || order.demand.area;
    const actualHours = order.actualHours;

    const billingResult = await this.billingEngine.calculate({
      orderId: id,
      mode: order.billingMode as 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE',
      pricePerUnit: order.pricePerUnit,
      actualArea,
      actualHours,
      fixedPrice: order.estimatedPrice,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.VERIFIED,
          verifiedAt: new Date(),
          actualPrice: billingResult.totalAmount,
        },
      });

      await tx.settlement.create({
        data: {
          orderId: id,
          amount: billingResult.totalAmount,
          platformFee: billingResult.platformFee,
          operatorAmount: billingResult.operatorAmount,
        },
      });
    });

    await this.creditEngine.handleOrderCompleted(order.operatorId, id, true);

    return {
      order: await this.findOne(id),
      billingResult,
    };
  }

  async settle(
    id: string,
    dispatcherId: string,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, dispatcherId, UserRole.PLATFORM_DISPATCHER);

    if (order.status !== OrderStatus.VERIFIED) {
      throw new BadRequestException('订单状态不允许结算');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'settle',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.SETTLED,
          settledAt: new Date(),
        },
      });

      await tx.settlement.updateMany({
        where: { orderId: id },
        data: { paidAt: new Date() },
      });

      await tx.machinery.update({
        where: { id: order.machineryId },
        data: { status: MachineryStatus.AVAILABLE },
      });
    });

    return this.findOne(id);
  }

  async cancel(
    id: string,
    userId: string,
    userRole: UserRole,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, userId, userRole);

    const allowedStatuses: OrderStatus[] = [
      OrderStatus.PENDING_ACCEPT,
      OrderStatus.ACCEPTED,
    ];

    if (!allowedStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('订单状态不允许取消');
    }

    const result = await this.stateMachineService.transitionOrder(
      id,
      'cancel',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.machinery.update({
        where: { id: order.machineryId },
        data: { status: MachineryStatus.AVAILABLE },
      });
    });

    return this.findOne(id);
  }

  async getHistory(id: string) {
    return this.auditLogService.getEntityHistory('Order', id);
  }

  async getNavigation(
    id: string,
    operatorId: string,
  ) {
    const order = await this.findOne(id, operatorId, UserRole.MACHINERY_OPERATOR);

    const machinery = await this.prisma.machinery.findUnique({
      where: { id: order.machineryId },
    });

    if (!machinery || !machinery.locationLng || !machinery.locationLat) {
      throw new BadRequestException('农机位置未知');
    }

    const route = await this.dispatchEngine.getRoute(
      { lng: machinery.locationLng, lat: machinery.locationLat },
      { lng: order.demand.locationLng, lat: order.demand.locationLat },
    );

    return {
      order: {
        id: order.id,
        address: order.demand.address,
        location: {
          lng: order.demand.locationLng,
          lat: order.demand.locationLat,
        },
        farmer: order.demand.farmer,
      },
      navigation: {
        distance: route.distance,
        duration: route.duration,
        polyline: route.polyline,
      },
    };
  }
}
