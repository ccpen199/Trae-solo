import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService, CreateOrderRequest, CreateOrderItem } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, OrderType, OrderSource, OrderItemStatus, UserRole } from '../common/types';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('订单')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  async createOrder(
    @Body() request: CreateOrderRequest,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.createOrder(
      request,
      req.user?.id || 'customer',
    );
  }

  @Get('search')
  @ApiOperation({ summary: '搜索订单' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'orderType', required: false, enum: OrderType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('orderType') orderType?: OrderType,
    @Query('tableId') tableId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: Order[]; total: number }> {
    return this.ordersService.getOrders(
      {
        status,
        orderType,
        tableId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      {
        page,
        limit,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Order> {
    return this.ordersService.getOrderById(id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: '根据订单号获取订单详情' })
  @ApiParam({ name: 'orderNumber', description: '订单号' })
  async getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<Order> {
    return this.ordersService.getOrderByNumber(orderNumber);
  }

  @Post(':id/confirm')
  @Roles(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '确认订单' })
  async confirmOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.confirmOrder(
      id,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post(':id/start-preparing')
  @Roles(UserRole.CHEF, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '开始制作订单' })
  async startPreparing(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.startPreparing(
      id,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post(':id/mark-ready')
  @Roles(UserRole.CHEF, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记订单已出餐' })
  async markOrderReady(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.markOrderReady(
      id,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post(':id/mark-served')
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记订单已上齐' })
  async markOrderServed(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.markOrderServed(
      id,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post(':id/add-items')
  @ApiOperation({ summary: '订单加菜' })
  async addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('items') items: CreateOrderItem[],
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.addItems(
      id,
      items,
      req.user?.id || 'customer',
      req.user?.name || '顾客',
    );
  }

  @Post('items/:itemId/cancel')
  @Roles(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '退菜' })
  async cancelItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('reason') reason: string,
    @Request() req,
  ): Promise<OrderItem> {
    return this.ordersService.cancelItem(
      itemId,
      req.user.id,
      req.user.name,
      reason,
    );
  }

  @Post('items/:itemId/start-preparing')
  @Roles(UserRole.CHEF, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '开始制作单个菜品' })
  async markOrderItemPreparing(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req,
  ): Promise<OrderItem> {
    return this.ordersService.markOrderItemPreparing(
      itemId,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post('items/:itemId/mark-ready')
  @Roles(UserRole.CHEF, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记单个菜品已出餐' })
  async markOrderItemReady(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req,
  ): Promise<OrderItem> {
    return this.ordersService.markOrderItemReady(
      itemId,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Post('items/:itemId/mark-served')
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记单个菜品已上菜' })
  async markOrderItemServed(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req,
  ): Promise<OrderItem> {
    return this.ordersService.markOrderItemServed(
      itemId,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }
}
