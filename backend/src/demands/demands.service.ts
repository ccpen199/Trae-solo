import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StateMachineService } from '../state-machine/state-machine.service';
import { DispatchEngineService } from '../engines/dispatch/dispatch-engine.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateDemandDto, UpdateDemandDto } from './dto/create-demand.dto';
import { DemandStatus, UserRole, BillingMode } from '@prisma/client';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Injectable()
export class DemandsService {
  constructor(
    private prisma: PrismaService,
    private stateMachineService: StateMachineService,
    private dispatchEngineService: DispatchEngineService,
    private auditLogService: AuditLogService,
  ) {}

  async create(farmerId: string, dto: CreateDemandDto, context: TransitionContext) {
    const demand = await this.prisma.demand.create({
      data: {
        farmerId,
        cropType: dto.cropType,
        area: dto.area,
        locationLng: dto.locationLng,
        locationLat: dto.locationLat,
        address: dto.address,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        requirements: dto.requirements,
        billingMode: dto.billingMode as BillingMode,
        pricePerUnit: dto.pricePerUnit,
        totalPrice: dto.totalPrice,
        status: DemandStatus.DRAFT,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    await this.auditLogService.logCreate('Demand', demand.id, context, {
      cropType: dto.cropType,
      area: dto.area,
      address: dto.address,
    });

    return demand;
  }

  async findAll(farmerId?: string, status?: DemandStatus, page: number = 1, pageSize: number = 20) {
    const where: Record<string, unknown> = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (status) {
      where.status = status;
    }

    const [demands, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return {
      demands,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const demand = await this.prisma.demand.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: true,
      },
    });

    if (!demand) {
      throw new NotFoundException('需求单不存在');
    }

    if (
      userRole !== UserRole.PLATFORM_DISPATCHER &&
      userRole !== UserRole.MACHINERY_OPERATOR &&
      demand.farmerId !== userId
    ) {
      throw new ForbiddenException('无权访问此需求单');
    }

    return demand;
  }

  async update(
    id: string,
    farmerId: string,
    dto: UpdateDemandDto,
    context: TransitionContext,
  ) {
    const demand = await this.findOne(id, farmerId);

    if (demand.status !== DemandStatus.DRAFT) {
      throw new BadRequestException('只能修改草稿状态的需求单');
    }

    const beforeData = {
      cropType: demand.cropType,
      area: demand.area,
      address: demand.address,
    };

    const updatedDemand = await this.prisma.demand.update({
      where: { id },
      data: {
        cropType: dto.cropType,
        area: dto.area,
        locationLng: dto.locationLng,
        locationLat: dto.locationLat,
        address: dto.address,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        requirements: dto.requirements,
        billingMode: dto.billingMode as BillingMode,
        pricePerUnit: dto.pricePerUnit,
        totalPrice: dto.totalPrice,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    await this.auditLogService.logUpdate('Demand', id, context, beforeData, {
      cropType: dto.cropType || demand.cropType,
      area: dto.area || demand.area,
      address: dto.address || demand.address,
    });

    return updatedDemand;
  }

  async submit(id: string, farmerId: string, context: TransitionContext) {
    const demand = await this.findOne(id, farmerId);

    if (demand.status !== DemandStatus.DRAFT) {
      throw new BadRequestException('只能提交草稿状态的需求单');
    }

    const result = await this.stateMachineService.transitionDemand(
      id,
      'submit',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.demand.update({
      where: { id },
      data: { status: DemandStatus.PENDING_MATCH },
    });

    return this.findOne(id);
  }

  async startMatch(id: string, context: TransitionContext) {
    const demand = await this.findOne(id);

    if (demand.status !== DemandStatus.PENDING_MATCH) {
      throw new BadRequestException('需求单状态不允许开始匹配');
    }

    const result = await this.stateMachineService.transitionDemand(
      id,
      'start_match',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.demand.update({
      where: { id },
      data: { status: DemandStatus.MATCHING },
    });

    try {
      const dispatchResult = await this.dispatchEngineService.matchMachinery({
        demandId: id,
        cropType: demand.cropType,
        area: demand.area,
        location: {
          lng: demand.locationLng,
          lat: demand.locationLat,
        },
        startTime: demand.startTime || undefined,
        endTime: demand.endTime || undefined,
        requirements: demand.requirements || undefined,
      });

      await this.stateMachineService.transitionDemand(
        id,
        'match_success',
        context,
      );

      await this.prisma.demand.update({
        where: { id },
        data: { status: DemandStatus.MATCHED },
      });

      return {
        demand: await this.findOne(id),
        candidates: dispatchResult.candidates,
        recommended: dispatchResult.recommended,
      };
    } catch (error) {
      throw new BadRequestException(`匹配失败: ${(error as Error).message}`);
    }
  }

  async cancel(id: string, userId: string, userRole: UserRole, context: TransitionContext) {
    const demand = await this.findOne(id, userId, userRole);

    const allowedStatuses = [
      DemandStatus.DRAFT,
      DemandStatus.PENDING_MATCH,
      DemandStatus.MATCHING,
      DemandStatus.MATCHED,
    ];

    if (!allowedStatuses.includes(demand.status)) {
      throw new BadRequestException('需求单状态不允许取消');
    }

    const result = await this.stateMachineService.transitionDemand(
      id,
      'cancel',
      context,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.demand.update({
      where: { id },
      data: { status: DemandStatus.CANCELLED },
    });

    return this.findOne(id);
  }

  async getHistory(id: string) {
    return this.auditLogService.getEntityHistory('Demand', id);
  }
}
