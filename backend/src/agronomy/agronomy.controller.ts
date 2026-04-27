import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgronomyService } from './agronomy.service';
import { Crop } from './entities/crop.entity';
import { GrowthStage } from './entities/growth-stage.entity';
import { EnvironmentThreshold, EnvironmentParameter, ThresholdType } from './entities/environment-threshold.entity';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Controller('agronomy')
export class AgronomyController {
  constructor(
    private readonly agronomyService: AgronomyService,
    private readonly auditService: AuditService,
  ) {}

  @Get('crops')
  async getCrops(
    @Query('limit') limit: number = 100,
  ): Promise<Crop[]> {
    return [];
  }

  @Get('crops/:id')
  async getCropById(@Param('id') id: string): Promise<Crop> {
    return this.agronomyService.getCropById(id);
  }

  @Post('crops')
  async createCrop(
    @Body() cropData: Partial<Crop>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<Crop> {
    const crop = await this.agronomyService.createCrop(cropData);

    await this.auditService.logCreate(
      AuditResourceType.CROP,
      crop.id,
      crop.name,
      { ...crop },
      operatorId,
      operatorName,
    );

    return crop;
  }

  @Get('growth-stages/by-day')
  async getGrowthStageByDay(
    @Query('cropId') cropId: string,
    @Query('growthDay') growthDay: number,
  ): Promise<GrowthStage | null> {
    return this.agronomyService.getGrowthStageByDay(cropId, growthDay);
  }

  @Post('growth-stages')
  async createGrowthStage(
    @Body() stageData: Partial<GrowthStage>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<GrowthStage> {
    const stage = await this.agronomyService.createGrowthStage(stageData);

    await this.agronomyService.updateGrowthStageOrder(stage.cropId);

    await this.auditService.logCreate(
      AuditResourceType.GROWTH_STAGE,
      stage.id,
      stage.name,
      { ...stage },
      operatorId,
      operatorName,
    );

    return stage;
  }

  @Get('thresholds/:growthStageId')
  async getThresholds(
    @Param('growthStageId') growthStageId: string,
  ): Promise<EnvironmentThreshold[]> {
    return this.agronomyService.getThresholdsForStage(growthStageId);
  }

  @Post('thresholds')
  async createThreshold(
    @Body() thresholdData: Partial<EnvironmentThreshold>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<EnvironmentThreshold> {
    const threshold = await this.agronomyService.createThreshold(thresholdData);

    await this.auditService.logCreate(
      AuditResourceType.THRESHOLD,
      threshold.id,
      `${threshold.parameterType} - ${threshold.thresholdType}`,
      { ...threshold },
      operatorId,
      operatorName,
    );

    return threshold;
  }

  @Get('threshold-check')
  async checkThreshold(
    @Query('growthStageId') growthStageId: string,
    @Query('parameterType') parameterType: EnvironmentParameter,
    @Query('value') value: number,
  ): Promise<{
    isViolation: boolean;
    thresholdType: ThresholdType | null;
    threshold: EnvironmentThreshold | null;
    direction: 'below' | 'above' | null;
  }> {
    return this.agronomyService.checkThresholdViolation(
      growthStageId,
      parameterType,
      value,
    );
  }

  @Get('optimal-value')
  async getOptimalValue(
    @Query('growthStageId') growthStageId: string,
    @Query('parameterType') parameterType: EnvironmentParameter,
  ): Promise<{ min: number; max: number; optimal: number } | null> {
    return this.agronomyService.getOptimalValue(growthStageId, parameterType);
  }
}
