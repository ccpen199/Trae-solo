import { Controller, Get, Param, Request, Query } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { UserRole } from '../types/enums';

@Controller('settlements')
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    if (req.user.role === UserRole.FARMER) {
      return this.settlementsService.findByFarmer(req.user.id, page, pageSize);
    } else if (req.user.role === UserRole.MACHINERY_OPERATOR) {
      return this.settlementsService.findByOperator(req.user.id, page, pageSize);
    } else {
      return this.settlementsService.findAll(undefined, undefined, page, pageSize);
    }
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.settlementsService.findOne(id, req.user.id, req.user.role);
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.settlementsService.findByOrder(orderId);
  }

  @Get('stats/summary')
  async getSummary(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.settlementsService.getSummary(req.user.id, req.user.role, startDate, endDate);
  }
}
