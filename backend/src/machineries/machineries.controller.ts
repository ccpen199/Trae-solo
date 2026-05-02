import { Controller, Get, Post, Put, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { MachineriesService } from './machineries.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, MachineryStatus } from '../types/enums';

@Controller('machineries')
export class MachineriesController {
  constructor(private machineriesService: MachineriesService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post()
  async create(@Body() body: {
    name: string;
    type: string;
    brand: string;
    model: string;
    plateNumber?: string;
    capacity?: number;
    locationLng?: number;
    locationLat?: number;
    operatorId?: string;
  }) {
    return this.machineriesService.create(body);
  }

  @Get()
  async findAll(
    @Query('status') status?: MachineryStatus,
    @Query('operatorId') operatorId?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.machineriesService.findAll(status, operatorId, page, pageSize);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.machineriesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      type?: string;
      brand?: string;
      model?: string;
      plateNumber?: string;
      capacity?: number;
      locationLng?: number;
      locationLat?: number;
      operatorId?: string;
      status?: MachineryStatus;
    },
  ) {
    return this.machineriesService.update(id, body);
  }

  @Post(':id/location')
  async updateLocation(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { lng: number; lat: number },
  ) {
    return this.machineriesService.updateLocation(
      id,
      body.lng,
      body.lat,
      req.user.id,
      req.user.role,
    );
  }
}
