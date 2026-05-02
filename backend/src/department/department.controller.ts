import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('科室')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '获取所有科室列表' })
  async findAll() {
    return this.departmentService.findAll();
  }

  @Get('tree')
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '获取科室树形结构' })
  async getTree() {
    return this.departmentService.getTree();
  }

  @Get('search')
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '搜索科室' })
  async search(@Query('q') query: string) {
    return this.departmentService.search(query);
  }

  @Get('stats')
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '获取科室统计' })
  async getStats() {
    return this.departmentService.getStatistics();
  }

  @Get('all')
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '获取所有科室（含已删除）' })
  async findAllWithDeleted() {
    return this.departmentService.findAllWithDeleted();
  }

  @Get(':id')
  @Permissions(Permission.DEPARTMENT_VIEW)
  @ApiOperation({ summary: '根据ID获取科室' })
  async findById(@Param('id') id: string) {
    return this.departmentService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_CREATE)
  @ApiOperation({ summary: '创建科室' })
  async create(
    @Body()
    data: {
      name: string;
      code: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
      floor?: string;
      roomNumber?: string;
    },
  ) {
    return this.departmentService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_UPDATE)
  @ApiOperation({ summary: '更新科室' })
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      name: string;
      code: string;
      description: string;
      parentId: string;
      sortOrder: number;
      floor: string;
      roomNumber: string;
      isActive: boolean;
    }>,
  ) {
    return this.departmentService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_DELETE)
  @ApiOperation({ summary: '删除科室' })
  async delete(@Param('id') id: string) {
    await this.departmentService.delete(id);
    return { message: '删除成功' };
  }

  @Put(':id/soft-delete')
  @Roles('ADMIN')
  @Permissions(Permission.DEPARTMENT_UPDATE)
  @ApiOperation({ summary: '软删除科室' })
  async softDelete(@Param('id') id: string) {
    return this.departmentService.softDelete(id);
  }
}
