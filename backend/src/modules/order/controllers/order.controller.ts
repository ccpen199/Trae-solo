import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderDto, PrepayOrderDto, ReportActualWeightDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, OrderStatus } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('订单')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: '创建直采订单' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  async findAll(
    @Request() req,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.findAll(req.user.id, req.user.role, status);
  }

  @Get('suborders')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: '获取我的子订单列表（农户）' })
  async getMySubOrders(
    @Request() req,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.getMySubOrders(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('suborders/:subOrderId')
  @Roles(Role.FARMER, Role.OPERATOR)
  @ApiOperation({ summary: '获取子订单详情' })
  async getSubOrder(@Param('subOrderId') subOrderId: string) {
    return this.orderService.getSubOrder(subOrderId);
  }

  @Put(':id')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: '更新订单信息' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto, req.user.id);
  }

  @Post(':id/prepay')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: '支付预付款' })
  async prepay(
    @Request() req,
    @Param('id') id: string,
    @Body() prepayDto: PrepayOrderDto,
  ) {
    return this.orderService.prepay(id, prepayDto, req.user.id);
  }

  @Post('suborders/:subOrderId/report-weight')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: '上报实采重量' })
  async reportActualWeight(
    @Request() req,
    @Param('subOrderId') subOrderId: string,
    @Body() reportDto: ReportActualWeightDto,
  ) {
    return this.orderService.reportActualWeight(
      subOrderId,
      reportDto,
      req.user.id,
      req.user.role
    );
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(
      id,
      updateStatusDto,
      req.user.id,
      req.user.role
    );
  }

  @Post(':id/cancel')
  @Roles(Role.BUYER, Role.OPERATOR)
  @ApiOperation({ summary: '取消订单' })
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body('remark') remark?: string,
  ) {
    return this.orderService.cancel(id, req.user.id, req.user.role, remark);
  }
}
