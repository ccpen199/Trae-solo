import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationEngineService } from './services/recommendation-engine.service';
import { RecommendQueryDto, RecommendFeedbackDto, BatchFeedbackDto } from './dto/recommendation.dto';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('城市数据秘书 - 智能推荐')
@Controller('recommend')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(
    private readonly recommendationEngineService: RecommendationEngineService,
  ) {}

  @Get('services')
  @ApiOperation({ summary: '事项推荐', description: '基于用户画像和行为推荐办事服务事项' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询事项推荐', recordRequest: false })
  async getServiceRecommendations(
    @Req() req: Request,
    @Query() query: RecommendQueryDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    let result = await this.recommendationEngineService.getRecommendations(
      userId, 'service_item', page, pageSize,
    );

    if (result.total === 0) {
      await this.recommendationEngineService.generateRecommendations(userId, 'service_item', pageSize);
      result = await this.recommendationEngineService.getRecommendations(
        userId, 'service_item', page, pageSize,
      );
    }

    return ResponseUtil.success(result, '获取成功');
  }

  @Get('certs')
  @ApiOperation({ summary: '证照到期提醒', description: '证照有效期到期提醒、年检提醒等' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询证照到期提醒', recordRequest: false })
  async getCertRecommendations(
    @Req() req: Request,
    @Query() query: RecommendQueryDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    let result = await this.recommendationEngineService.getRecommendations(
      userId, 'cert', page, pageSize,
    );

    if (result.total === 0) {
      await this.recommendationEngineService.generateRecommendations(userId, 'cert', pageSize);
      result = await this.recommendationEngineService.getRecommendations(
        userId, 'cert', page, pageSize,
      );
    }

    return ResponseUtil.success(result, '获取成功');
  }

  @Get('notifications')
  @ApiOperation({ summary: '政策通知', description: '政策推送、办事提醒、消息通知等' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询政策通知推荐', recordRequest: false })
  async getPolicyRecommendations(
    @Req() req: Request,
    @Query() query: RecommendQueryDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    let result = await this.recommendationEngineService.getRecommendations(
      userId, 'policy', page, pageSize,
    );

    if (result.total === 0) {
      await this.recommendationEngineService.generateRecommendations(userId, 'policy', pageSize);
      result = await this.recommendationEngineService.getRecommendations(
        userId, 'policy', page, pageSize,
      );
    }

    return ResponseUtil.success(result, '获取成功');
  }

  @Get('all')
  @ApiOperation({ summary: '全量推荐', description: '获取所有类型的推荐列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询全量推荐', recordRequest: false })
  async getAllRecommendations(
    @Req() req: Request,
    @Query() query: RecommendQueryDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const recommendType = query.recommendType;

    let result = await this.recommendationEngineService.getRecommendations(
      userId, recommendType, page, pageSize,
    );

    if (result.total === 0) {
      await this.recommendationEngineService.generateRecommendations(userId, recommendType, pageSize);
      result = await this.recommendationEngineService.getRecommendations(
        userId, recommendType, page, pageSize,
      );
    }

    return ResponseUtil.success(result, '获取成功');
  }

  @Post('feedback')
  @ApiOperation({ summary: '推荐反馈', description: '对推荐内容进行点击/忽略/收藏反馈' })
  @ApiResponse({ status: 200, description: '反馈已记录' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '推荐反馈' })
  async submitFeedback(
    @Req() req: Request,
    @Body() dto: RecommendFeedbackDto,
  ): Promise<ApiRespType<any>> {
    const result = await this.recommendationEngineService.handleFeedback(dto);
    return ResponseUtil.success(result, '反馈已记录');
  }

  @Post('batch-feedback')
  @ApiOperation({ summary: '批量反馈', description: '批量提交推荐反馈' })
  @ApiResponse({ status: 200, description: '反馈已记录' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '批量推荐反馈' })
  async submitBatchFeedback(
    @Req() req: Request,
    @Body() dto: BatchFeedbackDto,
  ): Promise<ApiRespType<any>> {
    const results = [];
    for (const item of dto.items) {
      try {
        const r = await this.recommendationEngineService.handleFeedback(item);
        results.push({ recommendationId: item.recommendationId, success: true, result: r });
      } catch (e) {
        results.push({ recommendationId: item.recommendationId, success: false, error: e.message });
      }
    }
    return ResponseUtil.success({ results, total: results.length }, '批量反馈完成');
  }

  @Get('unread-count')
  @ApiOperation({ summary: '未读推荐数量', description: '获取各类型推荐的未读数量统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询未读推荐数量', recordRequest: false })
  async getUnreadCount(
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const count = await this.recommendationEngineService.getUnreadCount(userId);
    return ResponseUtil.success(count, '获取成功');
  }

  @Post('mark-read')
  @ApiOperation({ summary: '全部标记已读', description: '将所有推荐标记为已读' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '标记推荐已读' })
  async markAllAsRead(
    @Req() req: Request,
    @Body('recommendType') recommendType?: string,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const count = await this.recommendationEngineService.markAllAsRead(userId, recommendType as any);
    return ResponseUtil.success({ markedCount: count }, '操作成功');
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新推荐', description: '重新生成用户的推荐内容' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '刷新推荐' })
  async refreshRecommendations(
    @Req() req: Request,
    @Body('recommendType') recommendType?: string,
    @Body('limit') limit?: number,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const recs = await this.recommendationEngineService.generateRecommendations(
      userId,
      recommendType as any,
      limit || 10,
    );

    return ResponseUtil.success({ generatedCount: recs.length, recommendations: recs }, '刷新成功');
  }
}
