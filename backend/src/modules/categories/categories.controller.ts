import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { RequiresPermission } from '../../common/decorators/auth.decorator';
import { PermissionModule, PermissionAction } from '../../common/types';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.CREATE)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  findAll(
    @Query('siteId') siteId: string,
    @Query('includeInactive') includeInactive: string,
  ) {
    return this.categoriesService.findAll(siteId, includeInactive === 'true');
  }

  @Get('tree/:siteId')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  getTree(@Param('siteId') siteId: string) {
    return this.categoriesService.getCategoryTree(siteId);
  }

  @Get('site/:siteId')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  findBySite(@Param('siteId') siteId: string) {
    return this.categoriesService.findBySite(siteId);
  }

  @Get(':id')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/descendants')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  getDescendants(@Param('id') id: string) {
    return this.categoriesService.getDescendants(id);
  }

  @Get(':id/ancestors')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.READ)
  getAncestors(@Param('id') id: string) {
    return this.categoriesService.getAncestors(id);
  }

  @Put(':id')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @RequiresPermission(PermissionModule.CATEGORY, PermissionAction.DELETE)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
