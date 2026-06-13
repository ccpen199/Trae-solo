import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard, VendorAuthGuard } from '../auth/guards';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any, @Request() req: any) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Only super admin can create vendors');
    }
    return this.vendorService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() q: any) {
    return this.vendorService.findAll(+q.page, +q.pageSize, q.keyword, q.status);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.vendorService.getStats();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.vendorService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.vendorService.update(id, dto);
  }

  @Post(':id/rotate-credentials')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  rotateCredentials(@Param('id') id: string) {
    return this.vendorService.rotateCredentials(id);
  }

  @Patch(':id/whitelist')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateWhitelist(@Param('id') id: string, @Body() { ipRanges }: { ipRanges: string[] }) {
    return this.vendorService.updateIpWhitelist(id, ipRanges);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  setStatus(@Param('id') id: string, @Body() { status }: { status: 'active' | 'suspended' }) {
    return this.vendorService.setStatus(id, status);
  }

  @Get(':id/devices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getDevices(@Param('id') id: string, @Query() q: any) {
    return this.vendorService.getVendorDevices(id, +q.page, +q.pageSize);
  }

  @Post('devices/register')
  @UseGuards(VendorAuthGuard)
  async registerDevice(@Request() req: any, @Body() dto: any) {
    return { vendorId: req.user.vendorId, ...dto };
  }
}
