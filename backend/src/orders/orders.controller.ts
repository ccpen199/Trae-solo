import { Controller, Get, Post, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, TrackPointDto } from './dto/create-order.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, OrderStatus } from '../types/enums';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post()
  async create(@Request() req, @Body() dto: CreateOrderDto) {
    const context: TransitionContext = {
      entityId: '',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.create(
      dto.demandId,
      dto.machineryId,
      dto.machineryId, // 这里应该从匹配结果中获取 operatorId
      req.user.id,
      context,
    );
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: OrderStatus,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.ordersService.findAll(req.user.id, req.user.role, status, page, pageSize);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id, req.user.role);
  }

  @Post(':id/accept')
  async accept(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.accept(id, req.user.id, context);
  }

  @Post(':id/reject')
  async reject(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.reject(id, req.user.id, context);
  }

  @Post(':id/arrive')
  async arrive(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.arrive(id, req.user.id, context);
  }

  @Post(':id/start')
  async startWork(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.startWork(id, req.user.id, context);
  }

  @Post(':id/track')
  async addTrackPoint(@Request() req, @Param('id') id: string, @Body() trackPoint: TrackPointDto) {
    return this.ordersService.addTrackPoint(id, req.user.id, trackPoint);
  }

  @Post(':id/complete')
  async complete(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.complete(id, req.user.id, context);
  }

  @Post(':id/verify')
  async verify(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.verify(id, req.user.id, req.user.role, context);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post(':id/settle')
  async settle(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.settle(id, req.user.id, context);
  }

  @Post(':id/cancel')
  async cancel(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.ordersService.cancel(id, req.user.id, req.user.role, context);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.ordersService.getHistory(id);
  }

  @Get(':id/navigation')
  async getNavigation(@Request() req, @Param('id') id: string) {
    return this.ordersService.getNavigation(id, req.user.id);
  }
}
