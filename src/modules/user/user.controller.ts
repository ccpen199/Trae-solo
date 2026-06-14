import { Controller, Get, Put, Body, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { UpdateUserDto, UserQueryDto } from './dto/user.dto';

@ApiTags('用户')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getProfile(user);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新用户信息' })
  async updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(user, dto);
  }

  @Get('applications')
  @ApiOperation({ summary: '获取我的办件列表' })
  async getMyApplications(@CurrentUser() user: CurrentUserPayload, @Query() query: UserQueryDto) {
    return this.userService.getMyApplications(user, query);
  }

  @Get('certificates')
  @ApiOperation({ summary: '获取我的电子证照' })
  async getMyCertificates(@CurrentUser() user: CurrentUserPayload, @Query() query: UserQueryDto) {
    return this.userService.getMyCertificates(user, query);
  }

  @Get('notifications')
  @ApiOperation({ summary: '获取我的通知消息' })
  async getMyNotifications(@CurrentUser() user: CurrentUserPayload, @Query() query: UserQueryDto) {
    return this.userService.getMyNotifications(user, query);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: '标记通知已读' })
  async markNotificationRead(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.userService.markNotificationRead(user, id);
  }
}
