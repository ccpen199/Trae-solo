import { Controller, Get, Post, Put, Delete, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { DemandsService } from './demands.service';
import { CreateDemandDto, UpdateDemandDto } from './dto/create-demand.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DemandStatus } from '../types/enums';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Controller('demands')
export class DemandsController {
  constructor(private demandsService: DemandsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateDemandDto) {
    const context: TransitionContext = {
      entityId: '',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.demandsService.create(req.user.id, dto, context);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: DemandStatus,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    if (req.user.role === UserRole.FARMER) {
      return this.demandsService.findAll(req.user.id, status, page, pageSize);
    }
    return this.demandsService.findAll(undefined, status, page, pageSize);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.demandsService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDemandDto) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.demandsService.update(id, req.user.id, dto, context);
  }

  @Post(':id/submit')
  async submit(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.demandsService.submit(id, req.user.id, context);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Post(':id/match')
  async startMatch(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.demandsService.startMatch(id, context);
  }

  @Post(':id/cancel')
  async cancel(@Request() req, @Param('id') id: string) {
    const context: TransitionContext = {
      entityId: id,
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.demandsService.cancel(id, req.user.id, req.user.role, context);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.demandsService.getHistory(id);
  }
}
