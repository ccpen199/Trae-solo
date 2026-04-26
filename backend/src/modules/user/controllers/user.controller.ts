import { Controller, Get, Put, Param, Body, Query, Request } from '@nestjs/common';
import { UserService } from './services/user.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('用户')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(Role.OPERATOR, Role.FINANCE)
  @ApiOperation({ summary: '获取用户列表' })
  async findAll(@Query('role') role?: Role) {
    return this.userService.findAll(role);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req) {
    return this.userService.findOne(req.user.id);
  }

  @Get('farmers')
  @Roles(Role.BUYER, Role.OPERATOR)
  @ApiOperation({ summary: '获取农户列表' })
  async getFarmers(@Query('activeOnly') activeOnly: string = 'true') {
    return this.userService.getFarmers(activeOnly === 'true');
  }

  @Get('buyers')
  @Roles(Role.FARMER, Role.OPERATOR)
  @ApiOperation({ summary: '获取采购商列表' })
  async getBuyers(@Query('activeOnly') activeOnly: string = 'true') {
    return this.userService.getBuyers(activeOnly === 'true');
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.FINANCE)
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put('me')
  @ApiOperation({ summary: '更新当前用户信息' })
  async updateCurrentUser(@Request() req, @Body() data: any) {
    return this.userService.update(req.user.id, data);
  }

  @Put(':id/status')
  @Roles(Role.OPERATOR)
  @ApiOperation({ summary: '更新用户状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.userService.updateStatus(id, isActive);
  }
}
