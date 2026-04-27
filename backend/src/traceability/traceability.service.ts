import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FarmingRecord, FarmingRecordType, HarvestQuality } from './entities/farming-record.entity';
import { HighYieldAnalysis, AnalysisStatus } from './entities/high-yield-analysis.entity';
import { StandardizedModel, ModelStatus } from './entities/standardized-model.entity';
import { SensorsService } from '../sensors/sensors.service';
import { AgronomyService } from '../agronomy/agronomy.service';

@Injectable()
export class TraceabilityService {
  private readonly logger = new Logger(TraceabilityService.name);

  constructor(
    @InjectRepository(FarmingRecord)
    private recordRepository: Repository<FarmingRecord>,
    @InjectRepository(HighYieldAnalysis)
    private analysisRepository: Repository<HighYieldAnalysis>,
    @InjectRepository(StandardizedModel)
    private modelRepository: Repository<StandardizedModel>,
    private sensorsService: SensorsService,
    private agronomyService: AgronomyService,
  ) {}

  async createFarmingRecord(recordData: Partial<FarmingRecord>): Promise<FarmingRecord> {
    const record = this.recordRepository.create(recordData);
    return this.recordRepository.save(record);
  }

  async getRecordsInRange(
    startTime: Date,
    endTime: Date,
    locationZone?: string,
  ): Promise<FarmingRecord[]> {
    const where: any = {
      occurredAt: Between(startTime, endTime),
      isDeleted: false,
    };

    if (locationZone) {
      where.locationZone = locationZone;
    }

    return this.recordRepository.find({
      where,
      order: { occurredAt: 'ASC' },
      relations: ['crop', 'growthStage'],
    });
  }

  async getHighYieldRecords(
    minYieldPerHectare: number,
    limit: number = 10,
  ): Promise<FarmingRecord[]> {
    return this.recordRepository.find({
      where: {
        recordType: FarmingRecordType.HARVEST,
        yieldPerHectare: Between(minYieldPerHectare, Infinity),
        isDeleted: false,
      },
      order: { yieldPerHectare: 'DESC' },
      take: limit,
      relations: ['crop', 'growthStage'],
    });
  }

  async analyzeHighYieldPeriod(
    cropId: string,
    startGrowthDay: number,
    endGrowthDay: number,
    referenceRecordId?: string,
  ): Promise<HighYieldAnalysis> {
    const analysis = this.analysisRepository.create({
      title: `高产分析 - ${cropId}`,
      description: '分析高产时期的环境参数和农事操作',
      status: AnalysisStatus.PROCESSING,
      targetYieldPerHectare: 0,
      startGrowthDay,
      endGrowthDay,
      cropId,
      referenceRecordId,
    });

    const savedAnalysis = await this.analysisRepository.save(analysis);

    await this.performAnalysis(savedAnalysis, cropId, startGrowthDay, endGrowthDay);

    return savedAnalysis;
  }

  private async performAnalysis(
    analysis: HighYieldAnalysis,
    cropId: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<void> {
    try {
      const crop = await this.agronomyService.getCropById(cropId);

      const environmentProfile = await this.analyzeEnvironmentProfile(
        cropId,
        startGrowthDay,
        endGrowthDay,
      );

      const irrigationPattern = await this.analyzeIrrigationPattern(
        'zone-a',
        startGrowthDay,
        endGrowthDay,
      );

      const fertilizationSchedule = await this.analyzeFertilizationSchedule(
        'zone-a',
        startGrowthDay,
        endGrowthDay,
      );

      const pestControlActions = await this.analyzePestControlActions(
        'zone-a',
        startGrowthDay,
        endGrowthDay,
      );

      const growthStageAnalysis = await this.analyzeGrowthStages(
        cropId,
        startGrowthDay,
        endGrowthDay,
      );

      const keySuccessFactors = this.deriveSuccessFactors(
        environmentProfile,
        irrigationPattern,
        growthStageAnalysis,
      );

      analysis.status = AnalysisStatus.COMPLETED;
      analysis.optimalEnvironmentProfile = environmentProfile;
      analysis.irrigationPattern = irrigationPattern;
      analysis.fertilizationSchedule = fertilizationSchedule;
      analysis.pestControlActions = pestControlActions;
      analysis.growthStageAnalysis = growthStageAnalysis;
      analysis.keySuccessFactors = keySuccessFactors;
      analysis.recommendations = this.generateRecommendations(keySuccessFactors);
      analysis.analyzedAt = new Date();

      await this.analysisRepository.save(analysis);
    } catch (error) {
      this.logger.error(`High yield analysis failed: ${error.message}`);
      analysis.status = AnalysisStatus.FAILED;
      await this.analysisRepository.save(analysis);
    }
  }

  private async analyzeEnvironmentProfile(
    cropId: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<HighYieldAnalysis['optimalEnvironmentProfile']> {
    return {
      temperature: { min: 20, max: 28, optimal: 24 },
      humidity: { min: 60, max: 80, optimal: 70 },
      soilMoisture: { min: 40, max: 60, optimal: 50 },
      soilPh: { min: 6.0, max: 7.0, optimal: 6.5 },
      lightIntensity: { min: 30000, max: 80000, optimal: 50000 },
      co2Level: { min: 400, max: 1000, optimal: 600 },
    };
  }

  private async analyzeIrrigationPattern(
    locationZone: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<HighYieldAnalysis['irrigationPattern']> {
    return {
      frequencyPerDay: 2,
      durationPerIrrigation: 30,
      totalVolumePerDay: 500,
      timingWindows: ['06:00-06:30', '18:00-18:30'],
    };
  }

  private async analyzeFertilizationSchedule(
    locationZone: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<HighYieldAnalysis['fertilizationSchedule']> {
    return [
      {
        growthDay: 10,
        fertilizerType: 'NPK 20-20-20',
        quantity: 50,
        unit: 'kg/ha',
      },
      {
        growthDay: 30,
        fertilizerType: 'NPK 15-30-15',
        quantity: 40,
        unit: 'kg/ha',
      },
    ];
  }

  private async analyzePestControlActions(
    locationZone: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<HighYieldAnalysis['pestControlActions']> {
    return [
      {
        growthDay: 25,
        pestType: '蚜虫',
        controlMethod: '化学防治',
        chemicalName: '吡虫啉',
      },
    ];
  }

  private async analyzeGrowthStages(
    cropId: string,
    startGrowthDay: number,
    endGrowthDay: number,
  ): Promise<HighYieldAnalysis['growthStageAnalysis']> {
    const crop = await this.agronomyService.getCropById(cropId);
    const stages = crop.growthStages || [];

    return stages
      .filter(stage => stage.startDay <= endGrowthDay && stage.endDay >= startGrowthDay)
      .map(stage => ({
        stageType: stage.stageType,
        durationDays: stage.endDay - stage.startDay + 1,
        environmentStats: {},
        keyActions: stage.thresholds?.map(t => `${t.parameterType}: ${t.minValue}-${t.maxValue}`) || [],
      }));
  }

  private deriveSuccessFactors(
    environmentProfile: any,
    irrigationPattern: any,
    growthStageAnalysis: any,
  ): HighYieldAnalysis['keySuccessFactors'] {
    return [
      {
        factor: '温度控制',
        importance: 9,
        description: `保持温度在 ${environmentProfile.temperature.min}-${environmentProfile.temperature.max}°C 范围内，对作物生长至关重要`,
      },
      {
        factor: '灌溉策略',
        importance: 8,
        description: `每日灌溉 ${irrigationPattern.frequencyPerDay} 次，每次 ${irrigationPattern.durationPerIrrigation} 分钟，保持土壤湿度在最佳范围`,
      },
      {
        factor: '湿度管理',
        importance: 7,
        description: `控制相对湿度在 ${environmentProfile.humidity.min}-${environmentProfile.humidity.max}%，减少病害发生`,
      },
    ];
  }

  private generateRecommendations(
    keySuccessFactors: HighYieldAnalysis['keySuccessFactors'],
  ): string {
    if (!keySuccessFactors || keySuccessFactors.length === 0) {
      return '暂无具体建议';
    }

    const topFactors = keySuccessFactors.sort((a, b) => b.importance - a.importance).slice(0, 3);

    return topFactors
      .map(f => `【${f.factor}】${f.description}`)
      .join('\n\n');
  }

  async createStandardizedModelFromAnalysis(
    analysisId: string,
    modelName: string,
    modelCode: string,
  ): Promise<StandardizedModel> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, isDeleted: false },
      relations: ['crop'],
    });

    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    if (analysis.status !== AnalysisStatus.COMPLETED) {
      throw new Error(`Analysis ${analysisId} is not completed`);
    }

    const model = this.modelRepository.create({
      name: modelName,
      code: modelCode,
      description: analysis.description,
      targetYieldPerHectare: analysis.targetYieldPerHectare,
      totalGrowthDays: analysis.endGrowthDay - analysis.startGrowthDay + 1,
      status: ModelStatus.DRAFT,
      cropId: analysis.cropId,
      irrigationSchedule: this.convertIrrigationSchedule(analysis.irrigationPattern),
      fertilizationSchedule: analysis.fertilizationSchedule,
    });

    return this.modelRepository.save(model);
  }

  private convertIrrigationSchedule(
    irrigationPattern: HighYieldAnalysis['irrigationPattern'],
  ): StandardizedModel['irrigationSchedule'] {
    if (!irrigationPattern) return [];

    return [
      {
        stageType: 'vegetative',
        frequencyPerDay: irrigationPattern.frequencyPerDay,
        durationPerIrrigation: irrigationPattern.durationPerIrrigation,
        targetSoilMoisture: 50,
        timingWindows: irrigationPattern.timingWindows,
      },
    ];
  }

  async activateModel(modelId: string): Promise<StandardizedModel> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId, isDeleted: false },
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.status = ModelStatus.ACTIVE;
    return this.modelRepository.save(model);
  }

  async getActiveModels(cropId?: string): Promise<StandardizedModel[]> {
    const where: any = {
      status: ModelStatus.ACTIVE,
      isDeleted: false,
    };

    if (cropId) {
      where.cropId = cropId;
    }

    return this.modelRepository.find({
      where,
      order: { usageCount: 'DESC' },
      relations: ['crop'],
    });
  }

  async incrementModelUsage(modelId: string): Promise<void> {
    await this.modelRepository.increment(
      { id: modelId, isDeleted: false },
      'usageCount',
      1,
    );
  }

  async getRecordById(id: string): Promise<FarmingRecord> {
    return this.recordRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['crop', 'growthStage', 'commands'],
    });
  }

  async getAnalysisById(id: string): Promise<HighYieldAnalysis> {
    return this.analysisRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['crop', 'referenceRecord'],
    });
  }

  async getModelById(id: string): Promise<StandardizedModel> {
    return this.modelRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['crop'],
    });
  }
}
