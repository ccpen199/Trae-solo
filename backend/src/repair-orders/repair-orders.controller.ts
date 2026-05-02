import { Controller, Get, Post, Put, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { CreateRepairOrderDto, AssignRepairOrderDto } from './dto/create-repair-order.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, RepairOrderStatus } from '../types/enums';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Controller('repair-orders')
export class RepairOrdersController {
  constructor(private repairOrdersService: RepairOrdersService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateRepairOrderDto) {
    const context: TransitionContext = {
      entityId: '',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.create(req.user.id, dto, context);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: RepairOrderStatus,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.repairOrdersService.findAll(req.user.id, req.user.role, status, page, pageSize);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.repairOrdersService.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post(':id/assign')
  async assign(@Request() req, @Param('id') id: string, @Body() dto: AssignRepairOrderDto) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.assign(id, req.user.id, dto, context);
  }

  @Post(':id/start')
  async startRepair(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.startRepair(id, req.user.id, context);
  }

  @Post(':id/complete')
  async complete(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.complete(id, req.user.id, context);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post(':id/verify')
  async verify(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.verify(id, req.user.id, context);
  }

  @Post(':id/cancel')
  async cancel(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.repairOrdersService.cancel(id, req.user.id, req.user.role, context);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.repairOrdersService.getHistory(id);
  }
}
