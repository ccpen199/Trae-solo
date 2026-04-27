import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TraceabilityService } from './traceability.service';
import { FarmingRecord, FarmingRecordType } from './entities/farming-record.entity';
import { HighYieldAnalysis } from './entities/high-yield-analysis.entity';
import { StandardizedModel, ModelStatus } from './entities/standardized-model.entity';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Controller('traceability')
export class TraceabilityController {
  constructor(
    private readonly traceabilityService: TraceabilityService,
    private readonly auditService: AuditService,
  ) {}

  @Post('records')
  async createFarmingRecord(
    @Body() recordData: Partial<FarmingRecord>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<FarmingRecord> {
    const record = await this.traceabilityService.createFarmingRecord({
      ...recordData,
      occurredAt: recordData.occurredAt || new Date(),
    });

    await this.auditService.logCreate(
      AuditResourceType.FARMING_RECORD,
      record.id,
      record.title,
      { ...record },
      operatorId,
      operatorName,
    );

    return record;
  }

  @Get('records')
  async getRecordsInRange(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('zone') zone?: string,
  ): Promise<FarmingRecord[]> {
    return this.traceabilityService.getRecordsInRange(
      new Date(startTime),
      new Date(endTime),
      zone,
    );
  }

  @Get('records/high-yield')
  async getHighYieldRecords(
    @Query('minYield') minYield: number,
    @Query('limit') limit: number = 10,
  ): Promise<FarmingRecord[]> {
    return this.traceabilityService.getHighYieldRecords(minYield, limit);
  }

  @Get('records/:id')
  async getRecordById(@Param('id') id: string): Promise<FarmingRecord> {
    return this.traceabilityService.getRecordById(id);
  }

  @Post('analysis/high-yield')
  async analyzeHighYieldPeriod(
    @Body() body: {
      cropId: string;
      startGrowthDay: number;
      endGrowthDay: number;
      referenceRecordId?: string;
      operatorName?: string;
    },
  ): Promise<HighYieldAnalysis> {
    const analysis = await this.traceabilityService.analyzeHighYieldPeriod(
      body.cropId,
      body.startGrowthDay,
      body.endGrowthDay,
      body.referenceRecordId,
    );

    await this.auditService.logCreate(
      AuditResourceType.HIGH_YIELD_ANALYSIS,
      analysis.id,
      analysis.title,
      { ...analysis },
      null,
      body.operatorName,
    );

    return analysis;
  }

  @Get('analysis/:id')
  async getAnalysisById(@Param('id') id: string): Promise<HighYieldAnalysis> {
    return this.traceabilityService.getAnalysisById(id);
  }

  @Post('models/create-from-analysis')
  async createModelFromAnalysis(
    @Body() body: {
      analysisId: string;
      modelName: string;
      modelCode: string;
      operatorName?: string;
    },
  ): Promise<StandardizedModel> {
    const model = await this.traceabilityService.createStandardizedModelFromAnalysis(
      body.analysisId,
      body.modelName,
      body.modelCode,
    );

    await this.auditService.logCreate(
      AuditResourceType.STANDARDIZED_MODEL,
      model.id,
      model.name,
      { ...model },
      null,
      body.operatorName,
    );

    return model;
  }

  @Post('models/:id/activate')
  async activateModel(
    @Param('id') id: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<StandardizedModel> {
    const model = await this.traceabilityService.activateModel(id);

    await this.auditService.logUpdate(
      AuditResourceType.STANDARDIZED_MODEL,
      model.id,
      model.name,
      { status: ModelStatus.DRAFT },
      { status: model.status },
      null,
      operatorName,
    );

    return model;
  }

  @Get('models/active')
  async getActiveModels(
    @Query('cropId') cropId?: string,
  ): Promise<StandardizedModel[]> {
    return this.traceabilityService.getActiveModels(cropId);
  }

  @Get('models/:id')
  async getModelById(@Param('id') id: string): Promise<StandardizedModel> {
    return this.traceabilityService.getModelById(id);
  }

  @Post('models/:id/increment-usage')
  async incrementModelUsage(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.traceabilityService.incrementModelUsage(id);
    return { success: true };
  }
}
