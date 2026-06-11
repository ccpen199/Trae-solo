import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';
import {
  CreateFlashSaleDto,
  UpdateFlashSaleDto,
  UpdateFlashSaleStatusDto,
  FlashSaleQueryDto,
  FlashSalePurchaseDto,
  FlashSaleItemQueryDto,
} from './dto';

@Controller('flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Post()
  async create(@Body() dto: CreateFlashSaleDto) {
    return this.flashSaleService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFlashSaleDto) {
    return this.flashSaleService.update(id, dto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateFlashSaleStatusDto) {
    return this.flashSaleService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.flashSaleService.delete(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.flashSaleService.findById(id);
  }

  @Get()
  async findPaginated(@Query() query: FlashSaleQueryDto) {
    return this.flashSaleService.findPaginated(query);
  }

  @Get(':id/items')
  async findActiveItems(@Param('id') id: string, @Query() query: FlashSaleItemQueryDto) {
    return this.flashSaleService.findActiveItems(id, query);
  }

  @Post('purchase')
  async purchase(@Body() dto: FlashSalePurchaseDto) {
    return this.flashSaleService.purchase(dto);
  }
}
