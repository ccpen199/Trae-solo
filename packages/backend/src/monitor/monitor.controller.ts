import { Controller, Get, Query, Post, Body, UseGuards, Put, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertLevel, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto, buildPagination, buildPaginationResult } from '../common/dto/pagination.dto';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.PROPERTY_STAFF)
export class AlertController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('level') level?: AlertLevel,
    @Query('deviceId') deviceId?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
  ) {
    const where: any = {};
    if (level) where.level = level;
    if (deviceId) where.deviceId = deviceId;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        ...buildPagination(pagination),
        where,
        include: { device: true },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.alert.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const unread = await this.prisma.alert.count({ where: { isRead: false } });
    const byLevel = await Promise.all(
      [AlertLevel.INFO, AlertLevel.WARNING, AlertLevel.ERROR, AlertLevel.CRITICAL].map(async (level) => ({
        level,
        count: await this.prisma.alert.count({ where: { isRead: false, level } }),
      })),
    );
    return { total: unread, byLevel };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  @Put('read-all')
  async markAllAsRead() {
    await this.prisma.alert.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  @Post()
  async create(
    @Body() body: {
      type: string;
      level: AlertLevel;
      title: string;
      content: string;
      deviceId?: string;
      extra?: any;
    },
  ) {
    return this.prisma.alert.create({ data: body });
  }
}

@Controller('monitor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.PROPERTY_STAFF)
export class MonitorController {
  constructor(private prisma: PrismaService) {}

  @Get('devices/status')
  async getDeviceStatus(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};

    const [total, online, offline] = await Promise.all([
      this.prisma.accessDevice.count({ where }),
      this.prisma.accessDevice.count({ where: { ...where, isOnline: true } }),
      this.prisma.accessDevice.count({ where: { ...where, isOnline: false } }),
    ]);

    const byType = await this.prisma.accessDevice.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
    });

    const offlineDevices = await this.prisma.accessDevice.findMany({
      where: { ...where, isOnline: false },
      include: { community: true, building: true },
      take: 20,
    });

    return { total, online, offline, byType, offlineDevices };
  }

  @Get('devices/heartbeat-report')
  async getHeartbeatReport(@Query('communityId') communityId?: string) {
    const where = communityId ? { communityId } : {};
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent = await this.prisma.accessDevice.count({
      where: { ...where, lastHeartbeat: { gte: oneHourAgo } },
    });
    const today = await this.prisma.accessDevice.count({
      where: { ...where, lastHeartbeat: { gte: oneDayAgo } },
    });

    return { lastHour: recent, last24Hours: today };
  }
}
