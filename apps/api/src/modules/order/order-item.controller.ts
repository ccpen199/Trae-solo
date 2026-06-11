import { Controller, Get, Put, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { UpdateOrderItemDto, OrderItemQueryDto } from './dto';

@Controller('order/items')
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.orderItemService.findById(id);
  }

  @Get()
  async findPaginated(@Query() query: OrderItemQueryDto) {
    return this.orderItemService.findPaginated(query);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderItemDto) {
    return this.orderItemService.update(id, dto);
  }
}
