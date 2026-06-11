import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto, UpdateProductCategoryDto, ProductCategoryQueryDto } from './dto';
import { getListQueryParams } from '@pet/shared/utils';
import type { ListQueryParams } from '@pet/shared/types';

@Controller('product/categories')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post()
  async create(@Body() dto: CreateProductCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.categoryService.delete(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Get()
  async findAll(@Query() query: ProductCategoryQueryDto) {
    return this.categoryService.findAll(query);
  }

  @Get('tree')
  async findTree(@Query('forceRefresh') forceRefresh?: string) {
    return this.categoryService.findTree(forceRefresh === 'true');
  }

  @Get('page/list')
  async findPaginated(@Query() query: Record<string, unknown>) {
    const params = getListQueryParams(query) as ListQueryParams;
    return this.categoryService.findPaginated(params);
  }

  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    return this.categoryService.getChildren(id);
  }

  @Get(':id/path')
  async getPath(@Param('id') id: string) {
    return this.categoryService.getPath(id);
  }
}
