import { Controller, Get, Put, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('通知消息')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('PATIENT', 'DOCTOR', 'NURSE', 'REGISTRAR', 'ADMIN')
  @ApiOperation({ summary: '获取我的通知列表' })
  async getMyNotifications(
    @Query('unreadOnly') unreadOnly?: string,
    @Request() req: any,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.id,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @Roles('PATIENT', 'DOCTOR', 'NURSE', 'REGISTRAR', 'ADMIN')
  @ApiOperation({ summary: '获取未读通知数量' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/read')
  @Roles('PATIENT', 'DOCTOR', 'NURSE', 'REGISTRAR', 'ADMIN')
  @ApiOperation({ summary: '标记通知为已读' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Put('mark-all-read')
  @Roles('PATIENT', 'DOCTOR', 'NURSE', 'REGISTRAR', 'ADMIN')
  @ApiOperation({ summary: '标记所有通知为已读' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}
