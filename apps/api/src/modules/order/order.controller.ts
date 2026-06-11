import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderQueryDto, CancelOrderDto, ConfirmReceiveDto, UpdateOrderStatusDto } from './dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Get()
  async findPaginated(@Query() query: OrderQueryDto) {
    return this.orderService.findPaginated(query);
  }

  @Post('cancel')
  async cancel(@Body() dto: CancelOrderDto & { userId: string }) {
    const { userId, ...cancelDto } = dto;
    return this.orderService.cancel(cancelDto, userId);
  }

  @Post('confirm-receive')
  async confirmReceive(@Body() dto: ConfirmReceiveDto & { userId: string }) {
    return this.orderService.confirmReceive(dto.orderId, dto.userId);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }
}
