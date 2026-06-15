import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserProfileService } from './services/user-profile.service';
import { DataAssetService } from './services/data-asset.service';
import { UserTagService } from './services/user-tag.service';
import { UpdateProfileDto, ProfileQueryDto } from './dto/profile.dto';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AssetType } from './entities/data-asset.entity';

@ApiTags('城市数据秘书 - 数据看板')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly dataAssetService: DataAssetService,
    private readonly userTagService: UserTagService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: '数据资产总览', description: '获取用户个人数据资产看板总览统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询数据资产总览', recordRequest: false })
  async getSummary(
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const [summary, userTags] = await Promise.all([
      this.dataAssetService.getDashboardSummary(userId),
      this.userTagService.getUserTags(userId),
    ]);

    return ResponseUtil.success({
      ...summary,
      userTags,
    }, '获取成功');
  }

  @Get('assets')
  @ApiOperation({ summary: '资产明细', description: '获取用户各类数据资产明细列表' })
  @ApiQuery({ name: 'assetType', description: '资产类型', required: false, enum: ['cert', 'social_security', 'housing_fund', 'tax', 'medical', 'education', 'transport'] })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询资产明细', recordRequest: false })
  async getAssets(
    @Req() req: Request,
    @Query('assetType') assetType?: AssetType,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const list = await this.dataAssetService.getAssetList(userId, assetType);
    return ResponseUtil.success({ list, total: list.length }, '获取成功');
  }

  @Get('profile')
  @ApiOperation({ summary: '用户画像', description: '获取用户画像信息和标签' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'query', description: '查询用户画像', recordRequest: false })
  async getProfile(
    @Req() req: Request,
    @Query() query?: ProfileQueryDto,
  ): Promise<ApiRespType<any>> {
    const currentUser = (req as any).user;
    const userId = query?.userId || currentUser.sub;

    const [profile, userTags] = await Promise.all([
      this.userProfileService.getProfile(userId),
      this.userTagService.getUserTags(userId),
    ]);

    return ResponseUtil.success({
      profile,
      tags: userTags,
    }, '获取成功');
  }

  @Put('profile')
  @ApiOperation({ summary: '更新画像', description: '更新或完善用户画像信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '更新用户画像' })
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const updated = await this.userProfileService.updateProfile(userId, dto);

    await this.userTagService.autoTagUser(userId);

    return ResponseUtil.success(updated, '更新成功');
  }

  @Get('sync')
  @ApiOperation({ summary: '同步数据资产', description: '从各委办局同步社保、公积金、医保、税务、证照等数据' })
  @ApiResponse({ status: 200, description: '同步任务已启动' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '同步数据资产' })
  async syncAssets(
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const result = await this.dataAssetService.syncFromDepartments(userId);
    return ResponseUtil.success(result, `同步完成：成功${result.synced}项，失败${result.failed}项`);
  }

  @Get('auto-tag')
  @ApiOperation({ summary: '自动打标签', description: '根据用户画像和行为数据自动打标签' })
  @ApiResponse({ status: 200, description: '打标签完成' })
  @AuditLog({ module: 'city-data-secretary', action: 'update', description: '自动打标签' })
  async autoTag(
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user.sub;

    const tags = await this.userTagService.autoTagUser(userId);
    return ResponseUtil.success({ matchedCount: tags.length, tags }, '自动打标签完成');
  }
}
