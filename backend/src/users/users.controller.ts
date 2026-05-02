import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole, UserStatus } from '../common/types';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('用户')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '创建用户' })
  async createUser(
    @Body()
    userData: {
      username: string;
      password: string;
      name: string;
      role?: UserRole;
      phone?: string;
      avatar?: string;
    },
    @Request() req,
  ): Promise<User> {
    return this.usersService.createUser(userData, req.user?.id);
  }

  @Post('init')
  @Public()
  @ApiOperation({ summary: '初始化默认用户' })
  async initDefaultUsers(): Promise<void> {
    return this.usersService.initDefaultUsers();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '获取所有用户' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req): Promise<User> {
    return this.usersService.findById(req.user.id);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '按角色获取用户' })
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.usersService.findByRole(role);
  }

  @Get('stats/by-role')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '按角色统计用户' })
  async countUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    return this.usersService.countUsersByRole();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '获取用户详情' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新用户' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<User>,
  ): Promise<User> {
    return this.usersService.updateUser(id, updates);
  }

  @Put('me/password')
  @ApiOperation({ summary: '修改当前用户密码' })
  async updatePassword(
    @Body()
    body: {
      oldPassword: string;
      newPassword: string;
    },
    @Request() req,
  ): Promise<boolean> {
    return this.usersService.updatePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '停用用户' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.deactivateUser(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '启用用户' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.activateUser(id);
  }
}
