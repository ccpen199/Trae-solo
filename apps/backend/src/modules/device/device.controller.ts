import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DeviceService } from './device.service';
import { JwtAuthGuard, VendorAuthGuard } from '../auth/guards';
import { SharePermission, RequirePermission } from '../auth/guards';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('vendor/register')
  @UseGuards(VendorAuthGuard)
  registerByVendor(@Request() req: any, @Body() dto: any) {
    return this.deviceService.registerByVendor(req.user.vendorId, dto);
  }

  @Post('claim')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  claimDevice(@Request() req: any, @Body() dto: any) {
    return this.deviceService.claimDevice(req.user.userId, req.user.homeId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any, @Query() query: any) {
    return this.deviceService.findAll(req.user.userId, req.user.homeId, query);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    return this.deviceService.getStats(req.user.homeId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.deviceService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.deviceService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.deviceService.remove(req.user.userId, id);
  }

  @Get(':id/telemetry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getTelemetry(@Param('id') id: string, @Request() req: any, @Query('range') range: any) {
    return this.deviceService.getTelemetry(id, req.user.userId, range);
  }

  @Post('discovery')
  @UseGuards(VendorAuthGuard)
  triggerDiscovery(@Request() req: any, @Body() dto: any) {
    return this.deviceService.triggerDiscovery(req.user.vendorId, dto.protocols, dto.timeoutMs);
  }
}
