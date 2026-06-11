import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { NotificationQueryDto, MarkReadDto, MarkAllReadDto } from './dto';
import { User } from '@pet/db';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findPaginated(@Req() req: Request & { user: User }, @Query() query: NotificationQueryDto) {
    return this.notificationService.findPaginated(req.user.id, query);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Req() req: Request & { user: User }) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Post('read')
  @UseGuards(AuthGuard('jwt'))
  async markRead(@Req() req: Request & { user: User }, @Body() dto: MarkReadDto) {
    return this.notificationService.markRead(req.user.id, dto);
  }

  @Post('read-all')
  @UseGuards(AuthGuard('jwt'))
  async markAllRead(@Req() req: Request & { user: User }, @Body() dto: MarkAllReadDto) {
    return this.notificationService.markAllRead(req.user.id, dto.type);
  }
}
