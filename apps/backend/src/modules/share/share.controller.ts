import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../auth/guards';
import { SharePermission } from '@iot/shared';

@ApiTags('Share')
@Controller('share')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  shareDevice(@Request() req: any, @Body() dto: { deviceId: string; shareeIdOrEmail: string; permission: SharePermission; expiredAt?: string }) {
    return this.shareService.shareDevice(req.user.userId, {
      ...dto,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
    });
  }

  @Get('device/:deviceId')
  getDeviceShares(@Param('deviceId') deviceId: string, @Request() req: any) {
    return this.shareService.getDeviceShares(deviceId, req.user.userId);
  }

  @Get('with-me')
  getSharedWithMe(@Request() req: any) {
    return this.shareService.getSharedWithMe(req.user.userId);
  }

  @Patch(':shareId')
  updatePermission(
    @Param('shareId') shareId: string,
    @Request() req: any,
    @Body() dto: { permission: SharePermission; expiredAt?: string },
  ) {
    return this.shareService.updatePermission(req.user.userId, shareId, {
      ...dto,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
    });
  }

  @Delete(':shareId')
  revokeShare(@Param('shareId') shareId: string, @Request() req: any) {
    return this.shareService.revokeShare(req.user.userId, shareId);
  }

  @Get('check')
  checkPermission(@Request() req: any, @Query() q: { deviceId: string; permission: SharePermission }) {
    return this.shareService.checkPermission(req.user.userId, q.deviceId, q.permission);
  }
}
