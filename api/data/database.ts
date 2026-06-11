import {
  User, Content, AuditRecord, Tag, Media, Role, Permission,
  ScenicSpot, ScenicSpotFlow, OTABookingData, IntangibleHeritage,
  CouponBatch, CouponConsumption, InvestmentProject, FestivalActivity,
  GuideCertification, Dashboard, OpenApi, ApiApplication,
  DistributionRule, DistributionRecord, SentimentAnalysis, PropagationNode,
  OperationLog, ContentSecurityCheckResponse
} from '../../shared/types';

interface Database {
  users: Map<string, User>;
  roles: Map<string, Role>;
  permissions: Map<string, Permission>;
  userRoles: Map<string, string[]>;
  rolePermissions: Map<string, string[]>;
  contents: Map<string, Content>;
  tags: Map<string, Tag>;
  contentTags: Map<string, string[]>;
  auditRecords: Map<string, AuditRecord[]>;
  media: Map<string, Media>;
  scenicSpots: Map<string, ScenicSpot>;
  scenicFlows: Map<string, ScenicSpotFlow[]>;
  otaBookings: Map<string, OTABookingData[]>;
  heritages: Map<string, IntangibleHeritage>;
  couponBatches: Map<string, CouponBatch>;
  couponConsumptions: Map<string, CouponConsumption[]>;
  investmentProjects: Map<string, InvestmentProject>;
  festivalActivities: Map<string, FestivalActivity>;
  guideCertifications: Map<string, GuideCertification>;
  dashboards: Map<string, Dashboard>;
  openApis: Map<string, OpenApi>;
  apiApplications: Map<string, ApiApplication>;
  distributionRules: Map<string, DistributionRule>;
  distributionRecords: Map<string, DistributionRecord[]>;
  sentimentAnalyses: Map<string, SentimentAnalysis[]>;
  propagationNodes: Map<string, PropagationNode[]>;
  operationLogs: OperationLog[];
  securityChecks: Map<string, ContentSecurityCheckResponse[]>;
}

export const db: Database = {
  users: new Map(),
  roles: new Map(),
  permissions: new Map(),
  userRoles: new Map(),
  rolePermissions: new Map(),
  contents: new Map(),
  tags: new Map(),
  contentTags: new Map(),
  auditRecords: new Map(),
  media: new Map(),
  scenicSpots: new Map(),
  scenicFlows: new Map(),
  otaBookings: new Map(),
  heritages: new Map(),
  couponBatches: new Map(),
  couponConsumptions: new Map(),
  investmentProjects: new Map(),
  festivalActivities: new Map(),
  guideCertifications: new Map(),
  dashboards: new Map(),
  openApis: new Map(),
  apiApplications: new Map(),
  distributionRules: new Map(),
  distributionRecords: new Map(),
  sentimentAnalyses: new Map(),
  propagationNodes: new Map(),
  operationLogs: [],
  securityChecks: new Map(),
};

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const now = (): string => new Date().toISOString();
