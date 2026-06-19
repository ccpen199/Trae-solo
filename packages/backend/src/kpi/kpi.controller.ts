import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, TicketStatus, TicketType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles, RolesGuard } from '../common/guards/roles.guard';

@Controller('kpi')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
export class KpiController {
  constructor(private prisma: PrismaService) {}

  @Get('overview')
  async getOverview(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalTickets, totalResidents, totalDevices, onlineDevices] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.user.count({ where: { role: Role.RESIDENT } }),
      this.prisma.accessDevice.count({ where: communityId ? { communityId } : {} }),
      this.prisma.accessDevice.count({ where: { ...(communityId ? { communityId } : {}), isOnline: true } }),
    ]);

    const thisMonthTickets = await this.prisma.ticket.count({
      where: { ...where, createdAt: { gte: startOfMonth } },
    });
    const lastMonthTickets = await this.prisma.ticket.count({
      where: { ...where, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    });

    const completedTickets = await this.prisma.ticket.count({
      where: { ...where, status: TicketStatus.COMPLETED },
    });

    const completionRate = totalTickets > 0 ? (completedTickets / totalTickets * 100) : 0;

    const ratings = await this.prisma.ticketRating.findMany({
      where: { ticket: where as any },
      select: { score: true },
    });
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    return {
      totalTickets,
      thisMonthTickets,
      lastMonthTickets,
      ticketGrowth: lastMonthTickets > 0 ? ((thisMonthTickets - lastMonthTickets) / lastMonthTickets * 100) : 0,
      totalResidents,
      totalDevices,
      onlineDevices,
      deviceOnlineRate: totalDevices > 0 ? (onlineDevices / totalDevices * 100) : 0,
      completionRate,
      avgRating,
    };
  }

  @Get('response-time')
  async getResponseTimeStats(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};

    const assignedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        assignedAt: { not: null },
        status: { in: [TicketStatus.ASSIGNED, TicketStatus.PROCESSING, TicketStatus.COMPLETED, TicketStatus.CLOSED] },
      },
      select: { createdAt: true, assignedAt: true, startedAt: true, completedAt: true },
    });

    let avgAssignTime = 0, avgStartTime = 0, avgCompleteTime = 0;
    if (assignedTickets.length > 0) {
      const assignTimes = assignedTickets
        .filter(t => t.assignedAt)
        .map(t => (t.assignedAt!.getTime() - t.createdAt.getTime()) / 60000);
      avgAssignTime = assignTimes.length > 0
        ? assignTimes.reduce((a, b) => a + b, 0) / assignTimes.length : 0;

      const startTimes = assignedTickets
        .filter(t => t.startedAt && t.assignedAt)
        .map(t => (t.startedAt!.getTime() - t.assignedAt!.getTime()) / 60000);
      avgStartTime = startTimes.length > 0
        ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : 0;

      const completeTimes = assignedTickets
        .filter(t => t.completedAt && t.createdAt)
        .map(t => (t.completedAt!.getTime() - t.createdAt.getTime()) / 3600000);
      avgCompleteTime = completeTimes.length > 0
        ? completeTimes.reduce((a, b) => a + b, 0) / completeTimes.length : 0;
    }

    return {
      avgAssignTime: Math.round(avgAssignTime * 100) / 100,
      avgStartTime: Math.round(avgStartTime * 100) / 100,
      avgCompleteTime: Math.round(avgCompleteTime * 100) / 100,
      sampleSize: assignedTickets.length,
    };
  }

  @Get('ticket-trend')
  async getTicketTrend(@Query('communityId') communityId?: string, @Query('days') days: number = 7) {
    const where = communityId ? { communityId } : {};
    const result: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayWhere = { ...where, createdAt: { gte: dateStart, lt: dateEnd } };
      const [created, completed] = await Promise.all([
        this.prisma.ticket.count({ where: dayWhere }),
        this.prisma.ticket.count({
          where: { ...where, completedAt: { gte: dateStart, lt: dateEnd } } as any,
        }),
      ]);

      result.push({
        date: dateStart.toISOString().split('T')[0],
        created,
        completed,
      });
    }

    return result;
  }

  @Get('ticket-by-type')
  async getTicketsByType(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};
    const types = [TicketType.REPAIR, TicketType.COMPLAINT, TicketType.SUGGESTION];

    return Promise.all(
      types.map(async (type) => {
        const total = await this.prisma.ticket.count({ where: { ...where, type } });
        const completed = await this.prisma.ticket.count({
          where: { ...where, type, status: TicketStatus.COMPLETED },
        });
        return { type, total, completed, rate: total > 0 ? (completed / total * 100) : 0 };
      }),
    );
  }

  @Get('staff-ranking')
  async getStaffRanking(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};

    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: [Role.PROPERTY_STAFF, Role.PROPERTY_ADMIN] } },
      select: { id: true, nickname: true, avatar: true },
    });

    return Promise.all(
      staffUsers.map(async (staff) => {
        const handled = await this.prisma.ticket.count({
          where: { ...where, handlerId: staff.id, status: { not: TicketStatus.PENDING } },
        });
        const completed = await this.prisma.ticket.count({
          where: { ...where, handlerId: staff.id, status: TicketStatus.COMPLETED },
        });
        const ratings = await this.prisma.ticketRating.findMany({
          where: { ticket: { handlerId: staff.id } as any },
          select: { score: true },
        });
        const avgScore = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
          : 0;

        return {
          ...staff,
          handled,
          completed,
          completionRate: handled > 0 ? (completed / handled * 100) : 0,
          avgScore: Math.round(avgScore * 10) / 10,
          ratedCount: ratings.length,
        };
      }),
    ).then(list => list.sort((a, b) => b.completed - a.completed));
  }
}
