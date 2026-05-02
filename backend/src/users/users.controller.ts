import { Controller, Get, Post, Put, Param, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types/enums';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() body: { name?: string; avatar?: string }) {
    return this.usersService.update(req.user.id, body);
  }

  @Get('credit/history')
  async getCreditHistory(
    @Request() req,
    @Param('page') page: number = 1,
    @Param('pageSize') pageSize: number = 20,
  ) {
    return this.usersService.getCreditHistory(req.user.id, page, pageSize);
  }

  @Get('credit/levels')
  async getCreditLevels() {
    return this.usersService.getCreditLevels();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_DISPATCHER)
  @Get('list')
  async listUsers(
    @Body('role') role?: UserRole,
    @Body('page') page: number = 1,
    @Body('pageSize') pageSize: number = 20,
  ) {
    // 实现用户列表查询
    return { message: '用户列表功能待实现' };
  }
}
