import { Controller, Get, UseGuards, Query, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto, buildPagination, buildPaginationResult } from '../common/dto/pagination.dto';

@Controller('communities')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommunityController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    const where = user.role === Role.SUPER_ADMIN ? {} : {
      users: { some: { userId: user.id } },
    };
    const [items, total] = await Promise.all([
      this.prisma.community.findMany({
        ...buildPagination(pagination),
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { buildings: true, users: true, devices: true } },
        },
      }),
      this.prisma.community.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.community.findUnique({
      where: { id },
      include: {
        buildings: {
          include: {
            units: {
              include: { houses: true },
            },
          },
        },
      },
    });
  }

  @Get(':id/buildings')
  async getBuildings(@Param('id') id: string) {
    return this.prisma.building.findMany({
      where: { communityId: id },
      include: { _count: { select: { units: true, devices: true } } },
    });
  }

  @Get('buildings/:buildingId/units')
  async getUnits(@Param('buildingId') buildingId: string) {
    return this.prisma.unit.findMany({
      where: { buildingId },
      include: { _count: { select: { houses: true } } },
    });
  }

  @Get('units/:unitId/houses')
  async getHouses(@Param('unitId') unitId: string) {
    return this.prisma.house.findMany({
      where: { unitId },
      include: { users: { include: { user: true } } },
    });
  }
}

@Controller('user-houses')
@UseGuards(AuthGuard('jwt'))
export class UserHouseController {
  constructor(private prisma: PrismaService) {}

  @Get('my')
  async getMyHouses(@CurrentUser() user: any) {
    return this.prisma.userHouse.findMany({
      where: { userId: user.id },
      include: {
        house: {
          include: {
            unit: {
              include: {
                building: {
                  include: { community: true },
                },
              },
            },
          },
        },
      },
    });
  }

  @Post('bind')
  async bindHouse(@Body() body: { houseId: string; relationship?: string }, @CurrentUser() user: any) {
    return this.prisma.userHouse.upsert({
      where: {
        userId_houseId: { userId: user.id, houseId: body.houseId },
      },
      create: {
        userId: user.id,
        houseId: body.houseId,
        relationship: body.relationship || 'OWNER',
      },
      update: { relationship: body.relationship || 'OWNER' },
    });
  }
}
