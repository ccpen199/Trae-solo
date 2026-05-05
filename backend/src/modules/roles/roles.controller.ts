import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
import { RequiresPermission } from '../../common/decorators/auth.decorator';
import { PermissionModule, PermissionAction } from '../../common/types';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequiresPermission(PermissionModule.ROLE, PermissionAction.CREATE)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequiresPermission(PermissionModule.ROLE, PermissionAction.READ)
  findAll(@Query('includeInactive') includeInactive: string) {
    return this.rolesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @RequiresPermission(PermissionModule.ROLE, PermissionAction.READ)
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission(PermissionModule.ROLE, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequiresPermission(PermissionModule.ROLE, PermissionAction.DELETE)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
