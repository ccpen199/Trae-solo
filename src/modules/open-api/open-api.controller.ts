import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  Res,
  HttpStatus,
  Inject,
  LoggerService,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OpenApiService, CreateThirdPartyAppDto } from './open-api.service';
import { ServiceItemService } from '../service-item/service-item.service';
import { ApplicationService } from '../application/application.service';
import { CertificateService } from '../certificate/certificate.service';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Response } from 'express';

@ApiTags('开放平台')
@Controller('open')
export class OpenApiController {
  constructor(
    private readonly openApiService: OpenApiService,
    private readonly serviceItemService: ServiceItemService,
    private readonly applicationService: ApplicationService,
    private readonly certificateService: CertificateService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  @Post('apps')
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建第三方应用' })
  async createApp(@Body() dto: CreateThirdPartyAppDto) {
    return this.openApiService.createApp(dto);
  }

  @Get('apps')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取第三方应用列表' })
  async listApps(@Query() query: any) {
    return this.openApiService.listApps(query);
  }

  @Put('apps/:appId/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用/停用应用' })
  async toggleApp(@Param('appId') appId: string, @Body('isActive') isActive: boolean) {
    return this.openApiService.toggleAppActive(appId, isActive);
  }

  @Post('apps/:appId/regenerate-secret')
  @ApiBearerAuth()
  @ApiOperation({ summary: '重新生成应用密钥' })
  async regenerateSecret(@Param('appId') appId: string) {
    return this.openApiService.regenerateSecret(appId);
  }

  @Get('apps/:appId/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取应用调用统计' })
  async getAppStats(@Param('appId') appId: string, @Query('days') days?: number) {
    return this.openApiService.getAppUsageStats(appId, days);
  }

  @Get('v1/service-items')
  @ApiOperation({ summary: '[开放API] 获取服务事项列表' })
  async getServiceItems(@Query() query: any, @Request() req: any, @Res() res: Response) {
    const startTime = Date.now();
    try {
      const result = await this.serviceItemService.findAll(query);
      await this.logCall(req, '/open/v1/service-items', 'GET', 200, startTime);
      res.status(HttpStatus.OK).json({ success: true, code: 'SUCCESS', data: result });
    } catch (e: any) {
      await this.logCall(req, '/open/v1/service-items', 'GET', 500, startTime, e.message);
      throw e;
    }
  }

  @Get('v1/service-items/:id')
  @ApiOperation({ summary: '[开放API] 获取事项详情' })
  async getServiceItem(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const startTime = Date.now();
    try {
      const result = await this.serviceItemService.findOne(id);
      await this.logCall(req, `/open/v1/service-items/${id}`, 'GET', 200, startTime);
      res.status(HttpStatus.OK).json({ success: true, code: 'SUCCESS', data: result });
    } catch (e: any) {
      await this.logCall(req, `/open/v1/service-items/${id}`, 'GET', 404, startTime, e.message);
      throw e;
    }
  }

  @Get('v1/certificates/verify/:certNo')
  @ApiOperation({ summary: '[开放API] 电子证照验证' })
  async verifyCert(@Param('certNo') certNo: string, @Request() req: any, @Res() res: Response) {
    const startTime = Date.now();
    try {
      const result = await this.certificateService.verify(certNo);
      await this.logCall(req, `/open/v1/certificates/verify/${certNo}`, 'GET', 200, startTime);
      res.status(HttpStatus.OK).json({ success: true, code: 'SUCCESS', data: result });
    } catch (e: any) {
      await this.logCall(
        req,
        `/open/v1/certificates/verify/${certNo}`,
        'GET',
        500,
        startTime,
        e.message,
      );
      throw e;
    }
  }

  private async logCall(
    req: any,
    endpoint: string,
    method: string,
    statusCode: number,
    startTime: number,
    errorMessage?: string,
  ) {
    try {
      await this.openApiService.logApiCall({
        appId: req.headers['x-app-id'] || 'anonymous',
        endpoint,
        method,
        statusCode,
        responseTime: Date.now() - startTime,
        requestIp: req.ip,
        errorMessage,
      });
    } catch (_) {}
  }
}
