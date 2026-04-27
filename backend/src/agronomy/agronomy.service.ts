import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { GrowthStage, GrowthStageType } from './entities/growth-stage.entity';
import { EnvironmentThreshold, EnvironmentParameter, ThresholdType } from './entities/environment-threshold.entity';

@Injectable()
export class AgronomyService {
  constructor(
    @InjectRepository(Crop)
    private cropRepository: Repository<Crop>,
    @InjectRepository(GrowthStage)
    private growthStageRepository: Repository<GrowthStage>,
    @InjectRepository(EnvironmentThreshold)
    private thresholdRepository: Repository<EnvironmentThreshold>,
  ) {}

  async getCropById(id: string): Promise<Crop> {
    const crop = await this.cropRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['growthStages', 'growthStages.thresholds'],
    });
    if (!crop) {
      throw new NotFoundException(`Crop with id ${id} not found`);
    }
    return crop;
  }

  async getGrowthStageByDay(cropId: string, growthDay: number): Promise<GrowthStage | null> {
    const stages = await this.growthStageRepository.find({
      where: { cropId, isDeleted: false },
      relations: ['thresholds'],
      order: { orderIndex: 'ASC' },
    });

    for (const stage of stages) {
      if (growthDay >= stage.startDay && growthDay <= stage.endDay) {
        return stage;
      }
    }
    return null;
  }

  async getThresholdsForStage(
    growthStageId: string,
  ): Promise<EnvironmentThreshold[]> {
    return this.thresholdRepository.find({
      where: { growthStageId, isDeleted: false },
    });
  }

  async getThresholdsForParameter(
    growthStageId: string,
    parameterType: EnvironmentParameter,
  ): Promise<EnvironmentThreshold[]> {
    return this.thresholdRepository.find({
      where: { growthStageId, parameterType, isDeleted: false },
    });
  }

  async checkThresholdViolation(
    growthStageId: string,
    parameterType: EnvironmentParameter,
    value: number,
  ): Promise<{
    isViolation: boolean;
    thresholdType: ThresholdType | null;
    threshold: EnvironmentThreshold | null;
    direction: 'below' | 'above' | null;
  }> {
    const thresholds = await this.getThresholdsForParameter(growthStageId, parameterType);
    
    if (thresholds.length === 0) {
      return {
        isViolation: false,
        thresholdType: null,
        threshold: null,
        direction: null,
      };
    }

    const criticalThreshold = thresholds.find(t => t.thresholdType === ThresholdType.CRITICAL);
    const warningThreshold = thresholds.find(t => t.thresholdType === ThresholdType.WARNING);

    if (criticalThreshold) {
      const criticalViolation = this.checkSingleThreshold(criticalThreshold, value);
      if (criticalViolation.isViolation) {
        return {
          isViolation: true,
          thresholdType: ThresholdType.CRITICAL,
          threshold: criticalThreshold,
          direction: criticalViolation.direction,
        };
      }
    }

    if (warningThreshold) {
      const warningViolation = this.checkSingleThreshold(warningThreshold, value);
      if (warningViolation.isViolation) {
        return {
          isViolation: true,
          thresholdType: ThresholdType.WARNING,
          threshold: warningThreshold,
          direction: warningViolation.direction,
        };
      }
    }

    return {
      isViolation: false,
      thresholdType: null,
      threshold: null,
      direction: null,
    };
  }

  private checkSingleThreshold(
    threshold: EnvironmentThreshold,
    value: number,
  ): { isViolation: boolean; direction: 'below' | 'above' | null } {
    if (threshold.minValue !== null && value < threshold.minValue) {
      return { isViolation: true, direction: 'below' };
    }
    if (threshold.maxValue !== null && value > threshold.maxValue) {
      return { isViolation: true, direction: 'above' };
    }
    return { isViolation: false, direction: null };
  }

  async getOptimalValue(
    growthStageId: string,
    parameterType: EnvironmentParameter,
  ): Promise<{ min: number; max: number; optimal: number } | null> {
    const optimalThreshold = await this.thresholdRepository.findOne({
      where: {
        growthStageId,
        parameterType,
        thresholdType: ThresholdType.OPTIMAL,
        isDeleted: false,
      },
    });

    if (!optimalThreshold) {
      return null;
    }

    const min = optimalThreshold.minValue ?? 0;
    const max = optimalThreshold.maxValue ?? 0;
    const optimal = (min + max) / 2;

    return { min, max, optimal };
  }

  async createCrop(cropData: Partial<Crop>): Promise<Crop> {
    const crop = this.cropRepository.create(cropData);
    return this.cropRepository.save(crop);
  }

  async getAllCrops(): Promise<Crop[]> {
    return this.cropRepository.find({
      where: { isDeleted: false },
      relations: ['growthStages', 'growthStages.thresholds'],
    });
  }

  async createGrowthStage(stageData: Partial<GrowthStage>): Promise<GrowthStage> {
    const stage = this.growthStageRepository.create(stageData);
    return this.growthStageRepository.save(stage);
  }

  async createThreshold(
    thresholdData: Partial<EnvironmentThreshold>,
  ): Promise<EnvironmentThreshold> {
    const threshold = this.thresholdRepository.create(thresholdData);
    return this.thresholdRepository.save(threshold);
  }

  async updateGrowthStageOrder(cropId: string): Promise<void> {
    const stages = await this.growthStageRepository.find({
      where: { cropId, isDeleted: false },
      order: { startDay: 'ASC' },
    });

    for (let i = 0; i < stages.length; i++) {
      stages[i].orderIndex = i;
      await this.growthStageRepository.save(stages[i]);
    }
  }
}
