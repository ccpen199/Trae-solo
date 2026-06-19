import { Controller, Get, Query, Param, Post, Body, UseGuards, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccessAuthType, AccessDeviceType, Role } from '../common/enums';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto, buildPagination, buildPaginationResult } from '../common/dto/pagination.dto';

@Controller('access/devices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccessDeviceController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.PROPERTY_STAFF)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('communityId') communityId?: string,
    @Query('type') type?: AccessDeviceType,
    @Query('isOnline') isOnline?: string,
  ) {
    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (type) where.type = type;
    if (isOnline !== undefined) where.isOnline = isOnline === 'true';

    const [items, total] = await Promise.all([
      this.prisma.accessDevice.findMany({
        ...buildPagination(pagination),
        where,
        include: {
          community: true,
          building: true,
          _count: { select: { auths: true, logs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.accessDevice.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.accessDevice.findUnique({
      where: { id },
      include: {
        community: true,
        building: true,
        alerts: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
  async create(@Body() body: {
    name: string;
    type: AccessDeviceType;
    communityId?: string;
    buildingId?: string;
    location: string;
    macAddress?: string;
  }) {
    return this.prisma.accessDevice.create({ data: body });
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.accessDevice.update({ where: { id }, data: body });
  }

  @Post(':id/heartbeat')
  async heartbeat(@Param('id') id: string) {
    const device = await this.prisma.accessDevice.update({
      where: { id },
      data: { isOnline: true, lastHeartbeat: new Date() },
    });
    return { success: true, device };
  }
}

@Controller('access/auth')
@UseGuards(AuthGuard('jwt'))
export class AccessAuthController {
  constructor(private prisma: PrismaService) {}

  @Get('my')
  async getMyAuths(@CurrentUser() user: any) {
    return this.prisma.accessAuth.findMany({
      where: { userId: user.id },
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async grantAuth(
    @CurrentUser() user: any,
    @Body() body: {
      deviceId: string;
      authType: AccessAuthType;
      phone?: string;
      startTime?: string;
      endTime?: string;
      maxUses?: number;
    },
  ) {
    let targetUserId = user.id;
    if (body.phone) {
      const target = await this.prisma.user.findUnique({ where: { phone: body.phone } });
      if (!target) throw new HttpException('目标用户不存在', HttpStatus.BAD_REQUEST);
      targetUserId = target.id;
    }

    const token = uuidv4();
    const auth = await this.prisma.accessAuth.create({
      data: {
        userId: targetUserId,
        deviceId: body.deviceId,
        authType: body.authType,
        qrCodeToken: body.authType === AccessAuthType.ONCE || body.authType === AccessAuthType.TEMPORARY ? token : null,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
        maxUses: body.maxUses,
        grantedBy: user.id,
        expiresAt: body.endTime ? new Date(body.endTime) : null,
      },
    });

    let qrCode: string | null = null;
    if (auth.qrCodeToken) {
      qrCode = await QRCode.toDataURL(JSON.stringify({
        token: auth.qrCodeToken,
        deviceId: body.deviceId,
        ts: Date.now(),
      }));
    }

    return { auth, qrCode };
  }

  @Post('verify')
  async verifyAccess(
    @Body() body: {
      deviceId: string;
      token?: string;
      userId?: string;
      accessType: string;
    },
  ) {
    let auth: any = null;
    let user: any = null;

    if (body.token) {
      auth = await this.prisma.accessAuth.findUnique({
        where: { qrCodeToken: body.token },
        include: { user: true },
      });
      if (!auth) {
        await this.logAccess(body.deviceId, null, null, body.accessType, false, '无效的二维码');
        throw new HttpException('无效的二维码', HttpStatus.FORBIDDEN);
      }
      if (auth.deviceId !== body.deviceId) {
        await this.logAccess(body.deviceId, auth.userId, auth.id, body.accessType, false, '设备不匹配');
        throw new HttpException('该二维码不适用于此设备', HttpStatus.FORBIDDEN);
      }
      if (auth.expiresAt && auth.expiresAt < new Date()) {
        await this.logAccess(body.deviceId, auth.userId, auth.id, body.accessType, false, '二维码已过期');
        throw new HttpException('二维码已过期', HttpStatus.FORBIDDEN);
      }
      if (auth.maxUses && auth.usedCount >= auth.maxUses) {
        await this.logAccess(body.deviceId, auth.userId, auth.id, body.accessType, false, '使用次数已达上限');
        throw new HttpException('使用次数已达上限', HttpStatus.FORBIDDEN);
      }
      user = auth.user;
      auth = await this.prisma.accessAuth.update({
        where: { id: auth.id },
        data: { usedCount: { increment: 1 } },
      });
    } else if (body.userId) {
      user = await this.prisma.user.findUnique({ where: { id: body.userId } });
      auth = await this.prisma.accessAuth.findFirst({
        where: {
          userId: body.userId,
          deviceId: body.deviceId,
          authType: AccessAuthType.PERMANENT,
        },
      });
      if (!auth) {
        await this.logAccess(body.deviceId, body.userId, null, body.accessType, false, '无门禁权限');
        throw new HttpException('无门禁权限', HttpStatus.FORBIDDEN);
      }
    } else {
      throw new HttpException('缺少验证信息', HttpStatus.BAD_REQUEST);
    }

    await this.logAccess(body.deviceId, user?.id || null, auth?.id || null, body.accessType, true);
    return { success: true, user: { id: user?.id, nickname: user?.nickname } };
  }

  private async logAccess(
    deviceId: string,
    userId: string | null,
    authId: string | null,
    accessType: string,
    result: boolean,
    failReason?: string,
  ) {
    return this.prisma.accessLog.create({
      data: { deviceId, userId, authId, accessType, accessResult: result, failReason },
    });
  }
}

@Controller('access/logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccessLogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.PROPERTY_STAFF)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('deviceId') deviceId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('result') result?: string,
  ) {
    const where: any = {};
    if (deviceId) where.deviceId = deviceId;
    if (userId) where.userId = userId;
    if (startDate) where.accessedAt = { ...where.accessedAt, gte: new Date(startDate) };
    if (endDate) where.accessedAt = { ...where.accessedAt, lte: new Date(endDate) };
    if (result !== undefined) where.accessResult = result === 'true';

    const [items, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        ...buildPagination(pagination),
        where,
        include: { device: true, user: true },
        orderBy: { accessedAt: 'desc' },
      }),
      this.prisma.accessLog.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
  async getStats(@Query('communityId') communityId?: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const deviceWhere = communityId ? { communityId } : {};
    const [totalDevices, onlineDevices, todayAccesses, weekAccesses] = await Promise.all([
      this.prisma.accessDevice.count({ where: deviceWhere }),
      this.prisma.accessDevice.count({ where: { ...deviceWhere, isOnline: true } }),
      this.prisma.accessLog.count({
        where: { device: deviceWhere, accessedAt: { gte: todayStart } },
      }),
      this.prisma.accessLog.count({
        where: { device: deviceWhere, accessedAt: { gte: weekStart } },
      }),
    ]);

    return { totalDevices, onlineDevices, todayAccesses, weekAccesses };
  }
}
