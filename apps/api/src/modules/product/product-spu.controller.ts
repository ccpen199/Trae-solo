import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductSpuService } from './product-spu.service';
import { CreateProductSpuDto, UpdateProductSpuDto, UpdateProductSpuStatusDto, ProductSpuQueryDto } from './dto';
import { ProductStatus } from '@pet/shared/enums';

@Controller('product/spus')
export class ProductSpuController {
  constructor(private readonly spuService: ProductSpuService) {}

  @Post()
  async create(@Body() dto: CreateProductSpuDto) {
    return this.spuService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductSpuDto) {
    return this.spuService.update(id, dto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateProductSpuStatusDto) {
    return this.spuService.updateStatus(id, dto);
  }

  @Put(':id/on-sale')
  async onSale(@Param('id') id: string) {
    return this.spuService.onSale(id);
  }

  @Put(':id/off-sale')
  async offSale(@Param('id') id: string) {
    return this.spuService.offSale(id);
  }

  @Put(':id/submit-audit')
  async submitAudit(@Param('id') id: string) {
    return this.spuService.submitAudit(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Body('merchantId') merchantId?: string) {
    await this.spuService.delete(id, merchantId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.spuService.findById(id);
  }

  @Get()
  async findPaginated(@Query() query: ProductSpuQueryDto) {
    return this.spuService.findPaginated(query);
  }
}
