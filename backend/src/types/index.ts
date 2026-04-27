export enum LivestockType {
  PIG = 'pig',
  CATTLE = 'cattle',
  SHEEP = 'sheep',
  CHICKEN = 'chicken'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  CASTRATED = 'castrated'
}

export enum LivestockStatus {
  IN_BARN = 'in_barn',
  SLAUGHTERED = 'slaughtered',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred'
}

export enum RecordStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

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

export enum AnomalyStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ESCALATED = 'escalated'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  FROZEN = 'frozen',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum UserRole {
  ADMIN = 'admin',
  FARM_MANAGER = 'farm_manager',
  FEEDER = 'feeder',
  VETERINARIAN = 'veterinarian',
  FINANCE = 'finance'
}

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
  plannedDate: Date;
  mandatory: boolean;
  status: 'pending' | 'completed' | 'overdue';
}
