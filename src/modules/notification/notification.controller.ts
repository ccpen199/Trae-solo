import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('通知')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读消息数量' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return { count: await this.notificationService.getUnreadCount(user.userId) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记单条消息已读' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有消息已读' })
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(user.userId);
  }
}
