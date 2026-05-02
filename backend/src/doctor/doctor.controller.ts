import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { DoctorTitle } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('医生')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '获取所有医生列表' })
  async findAll() {
    return this.doctorService.findAll();
  }

  @Get('search')
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '搜索医生' })
  async search(@Query('q') query: string) {
    return this.doctorService.search(query);
  }

  @Get('stats')
  @Roles('ADMIN')
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '获取医生统计' })
  async getStats() {
    return this.doctorService.getStatistics();
  }

  @Get('department/:departmentId')
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '按科室获取医生' })
  async findByDepartment(@Param('departmentId') departmentId: string) {
    return this.doctorService.findByDepartment(departmentId);
  }

  @Get('available')
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '获取指定日期可预约的医生' })
  async getAvailableDoctors(
    @Query('departmentId') departmentId: string,
    @Query('date') date: string,
  ) {
    return this.doctorService.getAvailableDoctorsByDate(departmentId, new Date(date));
  }

  @Get(':id')
  @Permissions(Permission.DOCTOR_VIEW)
  @ApiOperation({ summary: '根据ID获取医生' })
  async findById(@Param('id') id: string) {
    return this.doctorService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @Permissions(Permission.DOCTOR_CREATE)
  @ApiOperation({ summary: '创建医生' })
  async create(
    @Body()
    data: {
      userId: string;
      departmentId: string;
      title?: DoctorTitle;
      specialties: string[];
      introduction?: string;
      consultationFee?: number;
    },
  ) {
    return this.doctorService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions(Permission.DOCTOR_UPDATE)
  @ApiOperation({ summary: '更新医生信息' })
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      departmentId: string;
      title: DoctorTitle;
      specialties: string[];
      introduction: string;
      consultationFee: number;
      isActive: boolean;
    }>,
  ) {
    return this.doctorService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions(Permission.DOCTOR_DELETE)
  @ApiOperation({ summary: '删除医生' })
  async delete(@Param('id') id: string) {
    await this.doctorService.delete(id);
    return { message: '删除成功' };
  }

  @Put(':id/soft-delete')
  @Roles('ADMIN')
  @Permissions(Permission.DOCTOR_UPDATE)
  @ApiOperation({ summary: '软删除医生' })
  async softDelete(@Param('id') id: string) {
    return this.doctorService.softDelete(id);
  }
}
