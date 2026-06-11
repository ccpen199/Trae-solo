import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductSkuService } from './product-sku.service';
import { CreateProductSkuDto, UpdateProductSkuDto, UpdateStockDto, LockStockDto, DeductStockDto, UnlockStockDto } from './dto';

@Controller('product/skus')
export class ProductSkuController {
  constructor(private readonly skuService: ProductSkuService) {}

  @Post()
  async create(@Body() dto: CreateProductSkuDto) {
    return this.skuService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductSkuDto) {
    return this.skuService.update(id, dto);
  }

  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.skuService.updateStock(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.skuService.delete(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.skuService.findById(id);
  }

  @Get()
  async findPaginated(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('spuId') spuId?: string,
  ) {
    return this.skuService.findPaginated(page, pageSize, spuId);
  }

  @Get('spu/:spuId')
  async findBySpuId(@Param('spuId') spuId: string) {
    return this.skuService.findBySpuId(spuId);
  }

  @Get(':id/check-stock')
  async checkStock(@Param('id') id: string, @Query('quantity') quantity: number = 1) {
    return this.skuService.checkStock(id, quantity);
  }

  @Post('lock-stock')
  async lockStock(@Body() dto: LockStockDto & { orderId: string }) {
    const { orderId, items } = dto;
    return this.skuService.lockStock(items, orderId);
  }

  @Post('unlock-stock')
  async unlockStock(@Body() dto: UnlockStockDto & { orderId: string }) {
    const { orderId, items } = dto;
    return this.skuService.unlockStock(items, orderId);
  }

  @Post('deduct-stock')
  async deductStock(@Body() dto: DeductStockDto & { orderId: string }) {
    const { orderId, items } = dto;
    return this.skuService.deductStock(items, orderId);
  }
}
