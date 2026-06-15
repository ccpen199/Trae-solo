import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { SetMetadata } from '@nestjs/common';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';

import { CertCatalogService } from './services/cert-catalog.service';
import { CertRepositoryService, CertRecordDetail } from './services/cert-repository.service';
import { CertAccessControlService } from './services/cert-access-control.service';
import { CertVerifyService } from './services/cert-verify.service';

import {
  CertCatalogQueryDto,
  MyCertListQueryDto,
  AccessLogQueryDto,
  VerifyLogQueryDto,
  AuthorizationListQueryDto,
  DeptPullCertDto,
} from './dto/cert-query.dto';
import {
  CreateCertAuthorizationDto,
  RevokeAuthorizationDto,
} from './dto/cert-authorize.dto';
import { CertVerifyDto, CertVerifyByNoDto } from './dto/cert-verify.dto';

import { CertCatalog } from './entities/cert-catalog.entity';
import { CertAuthorization } from './entities/cert-authorization.entity';
import { CertAccessLog } from './entities/cert-access-log.entity';
import { CertVerifyLog } from './entities/cert-verify-log.entity';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('电子证照库')
@Controller('cert')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ECertController {
  private readonly logger = new Logger(ECertController.name);

  constructor(
    private readonly certCatalogService: CertCatalogService,
    private readonly certRepositoryService: CertRepositoryService,
    private readonly accessControlService: CertAccessControlService,
    private readonly certVerifyService: CertVerifyService,
  ) {}

  private getUserId(req: Request): string {
    return (req as any).user?.sub ?? (req as any).user?.userId;
  }

  private getUserName(req: Request): string | null {
    return (req as any).user?.username ?? (req as any).user?.realName ?? null;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
  }

  @Public()
  @Get('catalog')
  @ApiOperation({ summary: '证照目录列表', description: '查询32类电子证照目录，支持按分类、部门、关键词筛选' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCatalogList(
    @Query() query: CertCatalogQueryDto,
  ): Promise<ApiRespType<{ list: CertCatalog[]; total: number }>> {
    const result = await this.certCatalogService.findAll(query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Public()
  @Get('catalog/:code')
  @ApiOperation({ summary: '证照目录详情', description: '根据编码查询某类证照的详细定义，包括字段结构' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getCatalogDetail(
    @Param('code') code: string,
  ): Promise<ApiRespType<CertCatalog>> {
    const catalog = await this.certCatalogService.findByCode(code);
    return ResponseUtil.success(catalog, '查询成功');
  }

  @Get('my')
  @ApiOperation({ summary: '我的全部证照列表', description: '查询当前登录用户持有的所有电子证照' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询我的证照列表', recordRequest: false })
  async getMyCertList(
    @Query() query: MyCertListQueryDto,
    @Req() req: Request,
  ): Promise<ApiRespType<{ list: CertRecordDetail[]; total: number }>> {
    const userId = this.getUserId(req);
    const result = await this.certRepositoryService.getMyCertList(userId, query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('my/:certCode')
  @ApiOperation({ summary: '查询我的某类证照', description: '查询当前用户持有的指定类型证照详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询我的指定类型证照', recordRequest: false })
  async getMyCertByCode(
    @Param('certCode') certCode: string,
    @Req() req: Request,
  ): Promise<ApiRespType<CertRecordDetail[]>> {
    const userId = this.getUserId(req);
    const result = await this.certRepositoryService.getMyCertByCode(userId, certCode);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '授权某方调用我的证照', description: '授权指定委办局/事项在有效期内调用我的电子证照' })
  @ApiResponse({ status: 200, description: '授权成功' })
  @AuditLog({ module: 'e-cert', action: 'authorize', description: '创建证照授权' })
  async createAuthorization(
    @Body() dto: CreateCertAuthorizationDto,
    @Req() req: Request,
  ): Promise<ApiRespType<CertAuthorization>> {
    const userId = this.getUserId(req);
    const result = await this.accessControlService.createAuthorization(userId, dto);
    return ResponseUtil.success(result, '授权成功');
  }

  @Get('authorizations')
  @ApiOperation({ summary: '我的授权记录', description: '查询当前用户发出的所有证照授权记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询我的授权记录', recordRequest: false })
  async getMyAuthorizations(
    @Query() query: AuthorizationListQueryDto,
    @Req() req: Request,
  ): Promise<ApiRespType<{ list: CertAuthorization[]; total: number }>> {
    const userId = this.getUserId(req);
    const result = await this.accessControlService.getMyAuthorizations(userId, query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('revoke/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤销授权', description: '撤销已发出的证照授权' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  @AuditLog({ module: 'e-cert', action: 'revoke', description: '撤销证照授权' })
  async revokeAuthorization(
    @Param('id') authorizationId: string,
    @Body() dto: RevokeAuthorizationDto,
    @Req() req: Request,
  ): Promise<ApiRespType<CertAuthorization>> {
    const userId = this.getUserId(req);
    const result = await this.accessControlService.revokeAuthorization(
      userId,
      authorizationId,
      dto,
    );
    return ResponseUtil.success(result, '撤销成功');
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '证照验真', description: '在线验证电子证照真伪，支持哈希比对和委办局实时验真' })
  @ApiResponse({ status: 200, description: '验真完成' })
  @AuditLog({ module: 'e-cert', action: 'verify', description: '证照验真' })
  async verifyCert(
    @Body() dto: CertVerifyDto,
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    const ip = this.getClientIp(req);

    const result = await this.certVerifyService.verifyCert(
      userId,
      userName,
      'user',
      dto,
      ip,
    );

    return ResponseUtil.success(result, '验真完成');
  }

  @Post('verify/by-no')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '按证照编号验真', description: '根据证照编码和编号进行验真' })
  @ApiResponse({ status: 200, description: '验真完成' })
  @AuditLog({ module: 'e-cert', action: 'verify', description: '按编号证照验真' })
  async verifyCertByNo(
    @Body() dto: CertVerifyByNoDto,
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    const ip = this.getClientIp(req);

    const result = await this.certVerifyService.verifyCertByNo(
      userId,
      userName,
      'user',
      dto,
      ip,
    );

    return ResponseUtil.success(result, '验真完成');
  }

  @Get('verify-logs')
  @ApiOperation({ summary: '验真历史', description: '查询与我相关的证照验真历史记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询验真历史', recordRequest: false })
  async getVerifyLogs(
    @Query() query: VerifyLogQueryDto,
    @Req() req: Request,
  ): Promise<ApiRespType<{ list: CertVerifyLog[]; total: number }>> {
    const userId = this.getUserId(req);
    const result = await this.certVerifyService.getVerifyLogs(userId, query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('access-logs')
  @ApiOperation({ summary: '证照调用历史', description: '查询我的证照被调用的历史记录（留存90天）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询证照调用历史', recordRequest: false })
  async getAccessLogs(
    @Query() query: AccessLogQueryDto,
    @Req() req: Request,
  ): Promise<ApiRespType<{ list: CertAccessLog[]; total: number }>> {
    const userId = this.getUserId(req);
    const result = await this.certRepositoryService.getAccessLogs(userId, query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('dept/pull')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从委办局同步证照', description: '从38个委办局数据网关实时拉取并同步用户的电子证照数据' })
  @ApiResponse({ status: 200, description: '同步完成' })
  @AuditLog({ module: 'e-cert', action: 'sync', description: '从委办局同步证照数据' })
  async pullCertsFromDept(
    @Body() dto: DeptPullCertDto,
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const userId = this.getUserId(req);
    const ip = this.getClientIp(req);

    const result = await this.certRepositoryService.pullAndSyncCertsFromDept(
      userId,
      dto,
      ip,
    );

    return ResponseUtil.success(result, '同步完成');
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: '获取验真报告', description: '根据报告ID获取证照验真报告详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '获取验真报告', recordRequest: false })
  async getVerifyReport(
    @Param('reportId') reportId: string,
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const userId = this.getUserId(req);
    const result = await this.certVerifyService.getVerifyReport(userId, reportId);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('verify/stats')
  @ApiOperation({ summary: '我的验真统计', description: '获取当前用户作为验真方的验真统计数据' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'e-cert', action: 'query', description: '查询验真统计', recordRequest: false })
  async getVerifyStats(
    @Query('days') days: number = 30,
    @Req() req: Request,
  ): Promise<ApiRespType<{ total: number; passed: number; failed: number; passRate: string }>> {
    const userId = this.getUserId(req);
    const result = await this.certVerifyService.getVerifyStats(userId, days);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('authorizations/active-count')
  @ApiOperation({ summary: '有效授权数量', description: '查询当前用户的有效授权数量' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveAuthorizationCount(
    @Req() req: Request,
  ): Promise<ApiRespType<{ count: number }>> {
    const userId = this.getUserId(req);
    const count = await this.accessControlService.countActiveAuthorizations(userId);
    return ResponseUtil.success({ count }, '查询成功');
  }
}
