import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';
import { GuangdongCloudAdapter } from './adapters/guangdong-cloud.adapter';
import { NationalPlatformAdapter } from './adapters/national-platform.adapter';

@ApiTags('系统')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly gdCloud: GuangdongCloudAdapter,
    private readonly national: NationalPlatformAdapter,
  ) {}

  @Post('applications/:id/sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: '同步单个办件到省云+国家平台' })
  async syncApplication(@Param('id') id: string) {
    return this.integrationService.syncApplicationToAllPlatforms(id);
  }

  @Post('certificates/:id/sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: '同步单个证照到省云+国家平台' })
  async syncCertificate(@Param('id') id: string) {
    return this.integrationService.syncCertificateToAllPlatforms(id);
  }

  @Post('sync-batch')
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量同步所有待同步数据' })
  async syncBatch() {
    return this.integrationService.syncPendingApplications();
  }

  @Get('gd-cloud/service-items')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询广东省政务云事项' })
  async getGdCloudItems(@Query('category') category?: string) {
    return this.gdCloud.queryCloudServiceItems(category);
  }

  @Get('national/service-items/:itemCode')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询国家平台事项' })
  async getNationalItem(@Param('itemCode') itemCode: string) {
    return this.national.queryNationalItem(itemCode);
  }

  @Get('national/statistics')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取国家平台统计数据' })
  async getNationalStats(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.national.getStatisticsByDateRange(startDate, endDate);
  }
}
