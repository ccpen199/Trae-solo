import { Controller, Get, Query, Param, Post, Body, UseGuards, Put, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, TicketPriority, TicketStatus, TicketType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto, buildPagination, buildPaginationResult } from '../common/dto/pagination.dto';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TicketController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: TicketType,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('communityId') communityId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('handlerId') handlerId?: string,
    @CurrentUser() user?: any,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (communityId) where.communityId = communityId;
    if (creatorId) where.creatorId = creatorId;
    if (handlerId) where.handlerId = handlerId;

    if (user.role === Role.RESIDENT) {
      where.creatorId = user.id;
    } else if (user.role === Role.PROPERTY_STAFF) {
      where.OR = [{ creatorId: user.id }, { handlerId: user.id }];
    }

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        ...buildPagination(pagination),
        where,
        include: {
          creator: { select: { id: true, nickname: true, avatar: true, phone: true } },
          handler: { select: { id: true, nickname: true, phone: true } },
          community: true,
          house: true,
          tags: true,
          rating: true,
          _count: { select: { comments: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get('my')
  async getMyTickets(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.findAll(pagination, undefined, undefined, undefined, undefined, undefined, user.id, undefined, user);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.PROPERTY_STAFF)
  async getStats(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};
    const [total, pending, processing, completed, todayCreated] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.PENDING } }),
      this.prisma.ticket.count({ where: { ...where, status: { in: [TicketStatus.ASSIGNED, TicketStatus.PROCESSING] } } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.COMPLETED } }),
      this.prisma.ticket.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const typeStats = await Promise.all(
      [TicketType.REPAIR, TicketType.COMPLAINT, TicketType.SUGGESTION].map(async (type) => ({
        type,
        count: await this.prisma.ticket.count({ where: { ...where, type } }),
      })),
    );

    return { total, pending, processing, completed, todayCreated, typeStats };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, nickname: true, avatar: true, phone: true } },
        handler: { select: { id: true, nickname: true, phone: true } },
        community: true,
        house: true,
        tags: true,
        rating: true,
        comments: {
          include: { user: { select: { id: true, nickname: true, avatar: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          include: {},
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  @Post()
  async create(
    @Body() body: {
      type: TicketType;
      title: string;
      content: string;
      images?: any;
      priority?: TicketPriority;
      communityId: string;
      houseId?: string;
      location?: string;
      contactName?: string;
      contactPhone?: string;
      tags?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.prisma.ticket.create({
      data: {
        ...body,
        creatorId: user.id,
        priority: body.priority || TicketPriority.MEDIUM,
        tags: body.tags
          ? { create: body.tags.map((tag) => ({ tag })) }
          : undefined,
      },
    });
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus; handlerId?: string; remark?: string },
    @CurrentUser() user: any,
  ) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new HttpException('工单不存在', HttpStatus.NOT_FOUND);

    const updateData: any = { status: body.status };
    if (body.handlerId) updateData.handlerId = body.handlerId;

    if (body.status === TicketStatus.ASSIGNED && !updateData.handlerId && ticket.handlerId) {
      updateData.handlerId = ticket.handlerId;
    }
    if (body.status === TicketStatus.ASSIGNED) updateData.assignedAt = new Date();
    if (body.status === TicketStatus.PROCESSING) updateData.startedAt = new Date();
    if (body.status === TicketStatus.COMPLETED) updateData.completedAt = new Date();
    if (body.status === TicketStatus.CLOSED) updateData.closedAt = new Date();

    const [updated] = await Promise.all([
      this.prisma.ticket.update({ where: { id }, data: updateData }),
      this.prisma.ticketLog.create({
        data: {
          ticketId: id,
          action: `状态变更: ${ticket.status} -> ${body.status}`,
          oldStatus: ticket.status,
          newStatus: body.status,
          operatorId: user.id,
          remark: body.remark,
        },
      }),
    ]);
    return updated;
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string; images?: any; isInternal?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: user.id,
        content: body.content,
        images: body.images,
        isInternal: body.isInternal || false,
      },
    });
  }

  @Post(':id/rating')
  async rateTicket(
    @Param('id') id: string,
    @Body() body: { score: number; content?: string },
    @CurrentUser() user: any,
  ) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new HttpException('工单不存在', HttpStatus.NOT_FOUND);
    if (ticket.creatorId !== user.id) {
      throw new HttpException('只能评价自己的工单', HttpStatus.FORBIDDEN);
    }
    const existing = await this.prisma.ticketRating.findUnique({ where: { ticketId: id } });
    if (existing) throw new HttpException('已评价过', HttpStatus.BAD_REQUEST);

    return this.prisma.ticketRating.create({
      data: {
        ticketId: id,
        userId: user.id,
        score: body.score,
        content: body.content,
      },
    });
  }
}

@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketUserController {
  constructor(private prisma: PrismaService) {}
}
