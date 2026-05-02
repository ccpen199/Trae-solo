import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StateMachineService } from '../state-machine/state-machine.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateRepairOrderDto, AssignRepairOrderDto } from './dto/create-repair-order.dto';
import { RepairOrderStatus, UserRole, MachineryStatus } from '../types/enums';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Injectable()
export class RepairOrdersService {
  constructor(
    private prisma: PrismaService,
    private stateMachineService: StateMachineService,
    private auditLogService: AuditLogService,
  ) {}

  async create(
    reporterId: string,
    dto: CreateRepairOrderDto,
    context: TransitionContext,
  ) {
    const machinery = await this.prisma.machinery.findUnique({
      where: { id: dto.machineryId },
    });

    if (!machinery) {
      throw new NotFoundException('农机不存在');
    }

    if (machinery.operatorId !== reporterId) {
      throw new ForbiddenException('只能报修自己操作的农机');
    }

    const repairOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.repairOrder.create({
        data: {
          machineryId: dto.machineryId,
          reporterId,
          faultType: dto.faultType,
          faultDescription: dto.faultDescription,
          locationLng: dto.locationLng,
          locationLat: dto.locationLat,
          locationAddress: dto.locationAddress,
          status: RepairOrderStatus.PENDING,
        },
        include: {
          machinery: true,
          reporter: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      await tx.machinery.update({
        where: { id: dto.machineryId },
        data: { status: MachineryStatus.UNDER_MAINTENANCE },
      });

      return order;
    });

    await this.auditLogService.logCreate('RepairOrder', repairOrder.id, context, {
      machineryId: dto.machineryId,
      faultType: dto.faultType,
      faultDescription: dto.faultDescription,
    });

    return repairOrder;
  }

  async findAll(
    userId?: string,
    userRole?: UserRole,
    status?: RepairOrderStatus,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (userRole === UserRole.MACHINERY_OPERATOR) {
      const reporterMachineries = await this.prisma.machinery.findMany({
        where: { operatorId: userId },
        select: { id: true },
      });
      where.machineryId = { in: reporterMachineries.map((m) => m.id) };
    } else if (userRole === UserRole.MAINTENANCE_WORKER) {
      where.assigneeId = userId;
    } else if (userRole === UserRole.PLATFORM_DISPATCHER) {
      if (userId) {
        where.dispatcherId = userId;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.repairOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          machinery: true,
          reporter: {
            select: { id: true, name: true, phone: true },
          },
          assignee: {
            select: { id: true, name: true, phone: true },
          },
          dispatcher: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.repairOrder.count({ where }),
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
    const order = await this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        machinery: true,
        reporter: {
          select: { id: true, name: true, phone: true },
        },
        assignee: {
          select: { id: true, name: true, phone: true },
        },
        dispatcher: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('维修工单不存在');
    }

    if (
      userRole === UserRole.MACHINERY_OPERATOR &&
      order.reporterId !== userId
    ) {
      throw new ForbiddenException('无权访问此维修工单');
    }

    if (
      userRole === UserRole.MAINTENANCE_WORKER &&
      order.assigneeId !== userId
    ) {
      throw new ForbiddenException('无权访问此维修工单');
    }

    return order;
  }

  async assign(
    id: string,
    dispatcherId: string,
    dto: AssignRepairOrderDto,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, dispatcherId, UserRole.PLATFORM_DISPATCHER);

    if (order.status !== RepairOrderStatus.PENDING) {
      throw new BadRequestException('维修工单状态不允许分配');
    }

    const worker = await this.prisma.user.findUnique({
      where: { id: dto.assigneeId },
    });

    if (!worker || worker.role !== UserRole.MAINTENANCE_WORKER) {
      throw new BadRequestException('维修人员不存在或角色不正确');
    }

    const result = await this.stateMachineService.transitionRepairOrder(
      id,
      'assign',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.repairOrder.update({
      where: { id },
      data: {
        status: RepairOrderStatus.ASSIGNED,
        assigneeId: dto.assigneeId,
        dispatcherId,
        assignedAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  async startRepair(
    id: string,
    workerId: string,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, workerId, UserRole.MAINTENANCE_WORKER);

    if (order.status !== RepairOrderStatus.ASSIGNED) {
      throw new BadRequestException('维修工单状态不允许开始维修');
    }

    const result = await this.stateMachineService.transitionRepairOrder(
      id,
      'start_repair',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.repairOrder.update({
      where: { id },
      data: {
        status: RepairOrderStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  async complete(
    id: string,
    workerId: string,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, workerId, UserRole.MAINTENANCE_WORKER);

    if (order.status !== RepairOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('维修工单状态不允许完成');
    }

    const result = await this.stateMachineService.transitionRepairOrder(
      id,
      'complete',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.repairOrder.update({
      where: { id },
      data: {
        status: RepairOrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  async verify(
    id: string,
    dispatcherId: string,
    context: TransitionContext,
  ) {
    const order = await this.findOne(id, dispatcherId, UserRole.PLATFORM_DISPATCHER);

    if (order.status !== RepairOrderStatus.COMPLETED) {
      throw new BadRequestException('维修工单状态不允许验收');
    }

    const result = await this.stateMachineService.transitionRepairOrder(
      id,
      'verify',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.repairOrder.update({
        where: { id },
        data: {
          status: RepairOrderStatus.VERIFIED,
          verifiedAt: new Date(),
        },
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

    const allowedStatuses: RepairOrderStatus[] = [
      RepairOrderStatus.PENDING,
      RepairOrderStatus.ASSIGNED,
      RepairOrderStatus.IN_PROGRESS,
    ];

    if (!allowedStatuses.includes(order.status as RepairOrderStatus)) {
      throw new BadRequestException('维修工单状态不允许取消');
    }

    const result = await this.stateMachineService.transitionRepairOrder(
      id,
      'cancel',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.repairOrder.update({
        where: { id },
        data: { status: RepairOrderStatus.CANCELLED },
      });

      await tx.machinery.update({
        where: { id: order.machineryId },
        data: { status: MachineryStatus.AVAILABLE },
      });
    });

    return this.findOne(id);
  }

  async getHistory(id: string) {
    return this.auditLogService.getEntityHistory('RepairOrder', id);
  }
}
