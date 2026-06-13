import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { OtaService } from './ota.service';
import { JwtAuthGuard, VendorAuthGuard } from '../auth/guards';

@ApiTags('OTA')
@Controller('ota')
export class OtaController {
  constructor(private readonly otaService: OtaService) {}

  @Post('firmware')
  @UseGuards(VendorAuthGuard)
  uploadFirmware(@Request() req: any, @Body() dto: any) {
    return this.otaService.uploadFirmware({ ...dto, vendorId: req.user.vendorId });
  }

  @Get('firmware')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getFirmwareList(@Query('vendorId') vendorId?: string, @Query('model') model?: string) {
    return this.otaService.getFirmwareList(vendorId, model);
  }

  @Get('check/:deviceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkUpdate(@Param('deviceId') deviceId: string) {
    return this.otaService.checkUpdate(deviceId);
  }

  @Post('upgrade')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  startOta(@Body() dto: { deviceId: string; firmwareId: string }) {
    return this.otaService.startOta(dto.deviceId, dto.firmwareId);
  }

  @Post('batch-upgrade')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  batchOta(@Body() dto: { deviceIds: string[]; firmwareId: string }) {
    return this.otaService.batchOta(dto.deviceIds, dto.firmwareId);
  }

  @Patch('jobs/:jobId')
  @UseGuards(VendorAuthGuard)
  updateProgress(@Param('jobId') jobId: string, @Body() dto: any) {
    return this.otaService.updateOtaProgress(jobId, dto);
  }

  @Get('jobs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getOtaJobs(@Query('deviceId') deviceId?: string, @Query('status') status?: string) {
    return this.otaService.getOtaJobs(deviceId, status as any);
  }

  @Delete('jobs/:jobId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancelOta(@Param('jobId') jobId: string) {
    return this.otaService.cancelOta(jobId);
  }
}
