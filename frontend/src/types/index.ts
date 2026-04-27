export enum LivestockType {
  PIG = 'pig',
  CATTLE = 'cattle',
  SHEEP = 'sheep',
  CHICKEN = 'chicken'
}

export const LivestockTypeLabels: Record<LivestockType, string> = {
  [LivestockType.PIG]: '猪',
  [LivestockType.CATTLE]: '牛',
  [LivestockType.SHEEP]: '羊',
  [LivestockType.CHICKEN]: '鸡'
};

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  CASTRATED = 'castrated'
}

export const GenderLabels: Record<Gender, string> = {
  [Gender.MALE]: '公',
  [Gender.FEMALE]: '母',
  [Gender.CASTRATED]: '去势'
};

export enum LivestockStatus {
  IN_BARN = 'in_barn',
  SLAUGHTERED = 'slaughtered',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred'
}

export const LivestockStatusLabels: Record<LivestockStatus, string> = {
  [LivestockStatus.IN_BARN]: '在栏',
  [LivestockStatus.SLAUGHTERED]: '已出栏',
  [LivestockStatus.DECEASED]: '已死亡',
  [LivestockStatus.TRANSFERRED]: '已转移'
};

export enum AnomalyType {
  WEIGHT_GAIN_LOW = 'weight_gain_low',
  WEIGHT_GAIN_HIGH = 'weight_gain_high',
  CONSECUTIVE_DEVIATION = 'consecutive_deviation',
  VACCINE_OVERDUE = 'vaccine_overdue',
  VACCINE_UPCOMING = 'vaccine_upcoming',
  HEALTH_CHECK_REQUIRED = 'health_check_required',
  SLAUGHTER_FROZEN = 'slaughter_frozen',
  FEED_CONSUMPTION_ABNORMAL = 'feed_abnormal',
  TEMPERATURE_ABNORMAL = 'temperature_abnormal'
}

export const AnomalyTypeLabels: Record<AnomalyType, string> = {
  [AnomalyType.WEIGHT_GAIN_LOW]: '日增重偏低',
  [AnomalyType.WEIGHT_GAIN_HIGH]: '日增重偏高',
  [AnomalyType.CONSECUTIVE_DEVIATION]: '连续偏离异常',
  [AnomalyType.VACCINE_OVERDUE]: '疫苗逾期',
  [AnomalyType.VACCINE_UPCOMING]: '疫苗即将到期',
  [AnomalyType.HEALTH_CHECK_REQUIRED]: '需要健康排查',
  [AnomalyType.SLAUGHTER_FROZEN]: '出栏冻结',
  [AnomalyType.FEED_CONSUMPTION_ABNORMAL]: '采食量异常',
  [AnomalyType.TEMPERATURE_ABNORMAL]: '体温异常'
};

export enum AnomalyStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export const AnomalyStatusLabels: Record<AnomalyStatus, string> = {
  [AnomalyStatus.PENDING]: '待处理',
  [AnomalyStatus.PROCESSING]: '处理中',
  [AnomalyStatus.RESOLVED]: '已解决',
  [AnomalyStatus.DISMISSED]: '已驳回'
};

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const PriorityLabels: Record<Priority, string> = {
  [Priority.LOW]: '低',
  [Priority.MEDIUM]: '中',
  [Priority.HIGH]: '高',
  [Priority.CRITICAL]: '紧急'
};

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ESCALATED = 'escalated'
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待处理',
  [TaskStatus.IN_PROGRESS]: '处理中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.ESCALATED]: '已升级'
};

export enum ApprovalStatus {
  PENDING = 'pending',
  FROZEN = 'frozen',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const ApprovalStatusLabels: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: '待审批',
  [ApprovalStatus.FROZEN]: '已冻结',
  [ApprovalStatus.APPROVED]: '已通过',
  [ApprovalStatus.REJECTED]: '已拒绝'
};

export enum UserRole {
  ADMIN = 'admin',
  FARM_MANAGER = 'farm_manager',
  FEEDER = 'feeder',
  VETERINARIAN = 'veterinarian',
  FINANCE = 'finance'
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: '系统管理员',
  [UserRole.FARM_MANAGER]: '场长',
  [UserRole.FEEDER]: '饲养员',
  [UserRole.VETERINARIAN]: '兽医',
  [UserRole.FINANCE]: '财务'
};

export interface GrowthBaseline {
  breed: string;
  dailyGain: { day: number; weight: number; gain: number }[];
  feedingStandards: { stage: string; startDay: number; endDay: number; dailyFeed: number }[];
  vaccineRequirements: { name: string; dayRange: [number, number]; mandatory: boolean }[];
}

export interface FeedingPlanItem {
  day: number;
  stage: string;
  dailyFeedAmount: number;
  feedType: string;
}

export interface VaccineItem {
  name: string;
  plannedDate: string;
  mandatory: boolean;
  status: 'pending' | 'completed' | 'overdue';
}

export interface Livestock {
  id: string;
  earTagId: string;
  livestockType: LivestockType;
  breed: string;
  gender: Gender;
  birthDate: string;
  entryWeight: number;
  entryDate: string;
  source: string;
  barnId: string;
  penId: string;
  status: LivestockStatus;
  
  currentWeight?: number;
  lastFeedingDate?: string;
  lastVaccinationDate?: string;
  
  growthBaseline?: GrowthBaseline;
  feedingPlan?: FeedingPlanItem[];
  vaccineCalendar?: VaccineItem[];
  
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  
  operatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingRecord {
  id: string;
  earTagId: string;
  groupId?: string;
  
  feedingDate: string;
  feedType: string;
  requestedAmount: number;
  actualAmount: number;
  leftoverAmount: number;
  
  calculatedWeight?: number;
  dailyGain?: number;
  baselineGain?: number;
  deviation?: number;
  deviationStatus?: 'normal' | 'low' | 'high';
  
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  
  operatorId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaccinationRecord {
  id: string;
  earTagId: string;
  
  vaccineName: string;
  vaccineBatch: string;
  manufacturer?: string;
  
  vaccinationDate: string;
  plannedDate: string;
  nextBoosterDate?: string;
  
  dosage: number;
  administrationRoute: string;
  
  operatorId: string;
  notes?: string;
  
  isMandatory: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'exempt';
  
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyRecord {
  id: string;
  earTagId: string;
  type: AnomalyType;
  
  details: {
    description: string;
    detectedAt: string;
    relatedRecords?: string[];
    metrics?: {
      actualValue: number;
      baselineValue: number;
      deviation: number;
    };
  };
  
  status: AnomalyStatus;
  priority: Priority;
  
  assignedTo?: string;
  handledAt?: string;
  handledBy?: string;
  resolution?: string;
  
  notifications: {
    sentAt: string;
    recipient: string;
    channel: 'system' | 'sms' | 'app_push';
    delivered: boolean;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckTask {
  id: string;
  anomalyRecordId: string;
  earTagId: string;
  
  title: string;
  description: string;
  priority: Priority;
  
  assignedTo: string;
  assignedAt: string;
  
  checkRequirements: {
    temperature: boolean;
    appetite: boolean;
    behavior: boolean;
    feces: boolean;
    additional?: string[];
  };
  
  checkResult?: {
    temperature?: number;
    appetiteStatus?: 'normal' | 'poor' | 'none';
    behaviorStatus?: 'normal' | 'abnormal';
    fecesStatus?: 'normal' | 'abnormal';
    symptoms?: string[];
    preliminaryDiagnosis?: string;
    recommendation?: string;
    needTreatment: boolean;
    needIsolation: boolean;
  };
  
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SlaughterSettlement {
  id: string;
  earTagId: string;
  
  slaughterDate: string;
  slaughterWeight: number;
  sellingPrice: number;
  totalRevenue: number;
  
  lifecycleCost: {
    feedCost: number;
    medicineCost: number;
    laborCost: number;
    depreciationCost: number;
    otherCost: number;
    totalCost: number;
  };
  
  grossProfit: number;
  grossProfitMargin: number;
  
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    details: {
      date: string;
      description: string;
      amount: number;
    }[];
  }[];
  
  approvalStatus: ApprovalStatus;
  freezeReason?: string;
  
  confirmedBy?: string;
  confirmedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  
  role: UserRole;
  permissions: string[];
  
  isActive: boolean;
  lastLogin?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardMetrics {
  totalInventory: number;
  dailyEntry: number;
  dailySlaughter: number;
  pendingAnomalies: number;
  monthlyProfit: number;
  
  inventoryByType: {
    type: LivestockType;
    count: number;
    percentage: number;
  }[];
  
  recentAnomalies: AnomalyRecord[];
}
