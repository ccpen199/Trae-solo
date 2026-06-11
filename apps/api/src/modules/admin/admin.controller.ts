import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { SystemConfigDto, UpdateSystemConfigDto, DashboardQueryDto, SystemConfigQueryDto } from './dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getDashboardStats(@Query() query: DashboardQueryDto) {
    return this.adminService.getDashboardStats(query);
  }

  @Get('configs')
  @UseGuards(AuthGuard('jwt'))
  async getSystemConfigs(@Query() query: SystemConfigQueryDto) {
    return this.adminService.getSystemConfigs(query);
  }

  @Post('configs')
  @UseGuards(AuthGuard('jwt'))
  async createSystemConfig(@Body() dto: SystemConfigDto) {
    return this.adminService.createSystemConfig(dto);
  }

  @Put('configs/:key')
  @UseGuards(AuthGuard('jwt'))
  async updateSystemConfig(@Param('key') key: string, @Body() dto: UpdateSystemConfigDto) {
    return this.adminService.updateSystemConfig(key, dto);
  }

  @Delete('configs/:key')
  @UseGuards(AuthGuard('jwt'))
  async deleteSystemConfig(@Param('key') key: string) {
    return this.adminService.deleteSystemConfig(key);
  }
}
