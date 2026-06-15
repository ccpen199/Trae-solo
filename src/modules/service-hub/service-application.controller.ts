import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ApplicationService } from './services/application.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  SubmitApplicationDto,
  QueryApplicationDto,
  RevokeApplicationDto,
  UpdateMaterialStatusDto,
} from './dto/application.dto';
import { Application } from './entities/application.entity';
import { ApplicationProgress } from './entities/application-progress.entity';
import { ApplicationMaterial } from './entities/application-material.entity';

@ApiTags('服务事项-申报管理')
@Controller('service-hub/applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceApplicationController {
  private readonly logger = new Logger(ServiceApplicationController.name);

  constructor(
    private readonly applicationService: ApplicationService,
  ) {}

  private getUserId(req: Request): string {
    return (req as any).user?.sub || (req as any).user?.userId;
  }

  @Post('draft')
  @ApiOperation({ summary: '创建申报草稿', description: '创建新的申报单草稿，可后续补充提交' })
  @AuditLog({ module: 'service-hub', action: 'create', description: '创建申报草稿' })
  async createDraft(
    @Req() req: Request,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApiRespType<Application>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.createDraft(userId, dto);
    return ResponseUtil.created(result, '草稿创建成功');
  }

  @Put('draft/:id')
  @ApiOperation({ summary: '更新申报草稿' })
  @AuditLog({ module: 'service-hub', action: 'update', description: '更新申报草稿' })
  async updateDraft(
    @Req() req: Request,
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<ApiRespType<Application>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.updateDraft(userId, applicationId, dto);
    return ResponseUtil.success(result, '更新成功');
  }

  @Post('submit')
  @ApiOperation({ summary: '提交申报', description: '提交申报（支持从草稿提交或直接创建并提交' })
  @AuditLog({ module: 'service-hub', action: 'create', description: '提交服务事项申报' })
  async submit(
    @Req() req: Request,
    @Body() dto: SubmitApplicationDto,
  ): Promise<ApiRespType<Application>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.submit(userId, dto);
    return ResponseUtil.success(result, '申报提交成功');
  }

  @Get()
  @ApiOperation({ summary: '获取申报列表', description: '获取当前用户的申报列表' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询申报列表', recordRequest: false })
  async getList(
    @Req() req: Request,
    @Query() query: QueryApplicationDto,
  ): Promise<ApiRespType<{ list: Application[]; total: number }>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.findByUser(userId, query);
    return ResponseUtil.success(result, '获取成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '申报详情', description: '获取申报单详情，包含材料和流转记录' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询申报详情', recordRequest: false })
  async getDetail(
    @Req() req: Request,
    @Param('id') applicationId: string,
  ): Promise<ApiRespType<Application>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.findById(userId, applicationId);
    return ResponseUtil.success(result, '获取成功');
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '申报流转记录', description: '获取申报单的流转/审批记录' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询申报流转记录', recordRequest: false })
  async getProgress(
    @Param('id') applicationId: string,
  ): Promise<ApiRespType<ApplicationProgress[]>> {
    const list = await this.applicationService.getProgress(applicationId);
    return ResponseUtil.success(list, '获取成功');
  }

  @Get(':id/materials')
  @ApiOperation({ summary: '申报材料列表', description: '获取申报单的材料清单' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询申报材料列表', recordRequest: false })
  async getMaterials(
    @Param('id') applicationId: string,
  ): Promise<ApiRespType<ApplicationMaterial[]>> {
    const list = await this.applicationService.getMaterials(applicationId);
    return ResponseUtil.success(list, '获取成功');
  }

  @Patch(':id/materials/:materialId/status')
  @ApiOperation({ summary: '更新材料状态' })
  @AuditLog({ module: 'service-hub', action: 'update', description: '更新申报材料状态' })
  async updateMaterialStatus(
    @Param('id') applicationId: string,
    @Param('materialId') materialId: string,
    @Body() dto: UpdateMaterialStatusDto,
  ): Promise<ApiRespType<ApplicationMaterial>> {
    const result = await this.applicationService.updateMaterialStatus(
      applicationId,
      materialId,
      dto.status,
      dto.remark,
    );
    return ResponseUtil.success(result, '更新成功');
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: '撤销申报', description: '申请人撤销已提交的申报（受理后审批中的申报单' })
  @AuditLog({ module: 'service-hub', action: 'update', description: '撤销申报' })
  async revoke(
    @Req() req: Request,
    @Param('id') applicationId: string,
    @Body() dto: RevokeApplicationDto,
  ): Promise<ApiRespType<Application>> {
    const userId = this.getUserId(req);
    const result = await this.applicationService.revoke(userId, applicationId, dto);
    return ResponseUtil.success(result, '撤销成功');
  }
}
