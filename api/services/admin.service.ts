import type {
  CompanyQualification,
  RiskScore,
  RegionalLaborData,
  EntityType,
  RiskLevel,
  VerificationStatus,
} from '@shared/types/index.js';
import {
  mockCompanyQualifications,
  mockRiskScores,
  mockRegionalLaborData,
  mockCompanies,
  mockTalents,
  mockJobs,
} from '@shared/mock/data.js';

interface ReviewQualificationParams {
  qualificationId: string;
  status: VerificationStatus;
  notes?: string;
}

interface UpdateRiskScoreParams {
  id: string;
  riskLevel: RiskLevel;
  riskFactors: string[];
  overallScore: number;
}

interface RegionalLaborDataParams {
  region?: string;
  industry?: string;
  minHeatIndex?: number;
  trend?: string;
}

interface BlacklistEntityParams {
  entityId: string;
  entityType: EntityType;
  reason: string;
}

interface WhitelistEntityParams {
  entityId: string;
  entityType: EntityType;
}

interface HeatMapDataItem {
  region: string;
  industry: string;
  demandCount: number;
  supplyCount: number;
  heatIndex: number;
}

export class AdminService {
  static async getPendingCompanies(): Promise<CompanyQualification[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCompanyQualifications.filter(q => q.status === 'pending');
  }

  static async reviewCompanyQualification(
    params: ReviewQualificationParams
  ): Promise<CompanyQualification> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { qualificationId, status } = params;

    const qualification = mockCompanyQualifications.find(q => q.id === qualificationId);
    if (!qualification) {
      throw new Error('资质审核记录不存在');
    }

    qualification.status = status;
    if (status === 'approved') {
      qualification.verifiedAt = new Date();
    }

    return qualification;
  }

  static async getRiskScores(entityType?: EntityType): Promise<RiskScore[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (entityType) {
      return mockRiskScores.filter(r => r.entityType === entityType);
    }
    return mockRiskScores;
  }

  static async updateRiskScore(
    params: UpdateRiskScoreParams
  ): Promise<RiskScore> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { id, riskLevel, riskFactors, overallScore } = params;

    const riskScore = mockRiskScores.find(r => r.id === id);
    if (!riskScore) {
      throw new Error('风险评分记录不存在');
    }

    riskScore.riskLevel = riskLevel;
    riskScore.riskFactors = riskFactors;
    riskScore.overallScore = overallScore;
    riskScore.evaluatedAt = new Date();

    return riskScore;
  }

  static async getRegionalLaborData(
    params: RegionalLaborDataParams
  ): Promise<RegionalLaborData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let data = [...mockRegionalLaborData];

    if (params.region) {
      data = data.filter(d => d.region === params.region);
    }
    if (params.industry) {
      data = data.filter(d => d.industry === params.industry);
    }
    if (params.minHeatIndex !== undefined) {
      data = data.filter(d => d.heatIndex >= params.minHeatIndex);
    }
    if (params.trend) {
      data = data.filter(d => d.trend === params.trend);
    }

    return data;
  }

  static async getHeatMapData(): Promise<HeatMapDataItem[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const aggregated: Record<string, HeatMapDataItem> = {};

    mockRegionalLaborData.forEach(item => {
      const key = `${item.region}-${item.industry}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          region: item.region,
          industry: item.industry,
          demandCount: 0,
          supplyCount: 0,
          heatIndex: 0,
        };
      }
      aggregated[key].demandCount += item.demandCount;
      aggregated[key].supplyCount += item.supplyCount;
      aggregated[key].heatIndex = Math.max(aggregated[key].heatIndex, item.heatIndex);
    });

    return Object.values(aggregated);
  }

  static async blacklistEntity(
    params: BlacklistEntityParams
  ): Promise<{ entityId: string; entityType: EntityType; reason: string; blacklistedAt: Date }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { entityId, entityType, reason } = params;

    let entityExists = false;

    switch (entityType) {
      case 'company':
        entityExists = mockCompanies.some(c => c.id === entityId);
        break;
      case 'talent':
        entityExists = mockTalents.some(t => t.id === entityId);
        break;
      case 'job':
        entityExists = mockJobs.some(j => j.id === entityId);
        break;
    }

    if (!entityExists) {
      throw new Error('实体不存在');
    }

    return {
      entityId,
      entityType,
      reason,
      blacklistedAt: new Date(),
    };
  }

  static async whitelistEntity(
    params: WhitelistEntityParams
  ): Promise<{ entityId: string; entityType: EntityType; whitelistedAt: Date }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { entityId, entityType } = params;

    let entityExists = false;

    switch (entityType) {
      case 'company':
        entityExists = mockCompanies.some(c => c.id === entityId);
        break;
      case 'talent':
        entityExists = mockTalents.some(t => t.id === entityId);
        break;
      case 'job':
        entityExists = mockJobs.some(j => j.id === entityId);
        break;
    }

    if (!entityExists) {
      throw new Error('实体不存在');
    }

    return {
      entityId,
      entityType,
      whitelistedAt: new Date(),
    };
  }
}
