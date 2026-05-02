import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Role, Gender } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('用户')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('ADMIN')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: '获取所有用户列表' })
  async findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req: any) {
    return this.userService.findById(req.user.id);
  }

  @Get('search')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: '搜索用户' })
  async search(@Query('q') query: string) {
    return this.userService.search(query);
  }

  @Get('role/:role')
  @Roles('ADMIN')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: '按角色获取用户' })
  async findByRole(@Param('role') role: Role) {
    return this.userService.findByRole(role);
  }

  @Get('stats')
  @Roles('ADMIN')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: '获取用户统计' })
  async getStats() {
    return this.userService.countByRole();
  }

  @Get(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: '根据ID获取用户' })
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @Permissions(Permission.USER_CREATE)
  @ApiOperation({ summary: '创建用户' })
  async create(
    @Body()
    data: {
      username: string;
      password: string;
      name: string;
      role?: Role;
      email?: string;
      phone?: string;
      gender?: Gender;
      birthDate?: Date;
      idNumber?: string;
      address?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
    },
  ) {
    return this.userService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: '更新用户信息' })
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      gender: Gender;
      birthDate: Date;
      idNumber: string;
      address: string;
      emergencyContact: string;
      emergencyPhone: string;
      isActive: boolean;
    }>,
  ) {
    return this.userService.update(id, data);
  }

  @Put('me/profile')
  @ApiOperation({ summary: '更新当前用户资料' })
  async updateProfile(
    @Request() req: any,
    @Body()
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      gender: Gender;
      birthDate: Date;
      address: string;
      emergencyContact: string;
      emergencyPhone: string;
    }>,
  ) {
    return this.userService.update(req.user.id, data);
  }

  @Put('me/password')
  @ApiOperation({ summary: '修改当前用户密码' })
  async updatePassword(
    @Request() req: any,
    @Body() data: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.updatePassword(req.user.id, data.oldPassword, data.newPassword);
  }

  @Put(':id/reset-password')
  @Roles('ADMIN')
  @Permissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: '重置用户密码' })
  async resetPassword(@Param('id') id: string, @Body() data: { newPassword: string }) {
    return this.userService.resetPassword(id, data.newPassword);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions(Permission.USER_DELETE)
  @ApiOperation({ summary: '删除用户' })
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { message: '删除成功' };
  }
}
