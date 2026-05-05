import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SitesService, CreateSiteDto, UpdateSiteDto } from './sites.service';
import { RequiresPermission } from '../../common/decorators/auth.decorator';
import { PermissionModule, PermissionAction } from '../../common/types';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @RequiresPermission(PermissionModule.SITE, PermissionAction.CREATE)
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  @RequiresPermission(PermissionModule.SITE, PermissionAction.READ)
  findAll(@Query('includeInactive') includeInactive: string) {
    return this.sitesService.findAll(includeInactive === 'true');
  }

  @Get('tree')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.READ)
  getTree() {
    return this.sitesService.getSiteTree();
  }

  @Get('code/:code')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.READ)
  findByCode(@Param('code') code: string) {
    return this.sitesService.findByCode(code);
  }

  @Get(':id')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.READ)
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Get(':id/descendants')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.READ)
  getDescendants(@Param('id') id: string) {
    return this.sitesService.getDescendants(id);
  }

  @Put(':id')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @RequiresPermission(PermissionModule.SITE, PermissionAction.DELETE)
  remove(@Param('id') id: string) {
    return this.sitesService.remove(id);
  }
}
