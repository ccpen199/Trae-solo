export type ConnectionStatus = "connected" | "disconnected" | "pairing";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "dismissed" | "pending_review" | "needs_referral";
export type AlertType = "heart_rate_spike" | "low_blood_oxygen" | "high_stress" | "abnormal_hrv" | "custom";
export type DispositionStatus = "observed" | "medication_adjusted" | "lifestyle_change" | "referral_suggested" | "no_action";

export type DataValidity = "realtime" | "cached" | "offline";

export type SyncStatus = "idle" | "syncing" | "completed" | "failed";
export type AbstractionStatus = "pending" | "adapted" | "unsupported" | "partial";
export type PrivacyStatus = "not_processed" | "masked" | "encrypted" | "anonymized";
export type ArchiveStatus = "not_generated" | "generating" | "completed" | "failed";

export type ConditionOperator = "gt" | "lt" | "gte" | "lte" | "spike_percent";

export type UserRole = "user" | "admin" | "sysadmin";

export type ExerciseIntensity = "low" | "medium" | "high";

export type SleepStage = "deep" | "light" | "rem" | "awake";

export interface Device {
  id: string;
  userId: string;
  brand: string;
  model: string;
  name: string;
  firmwareVersion: string;
  batteryLevel: number;
  connectionStatus: ConnectionStatus;
  lastSyncTime: string;
  signalStrength?: number;
  syncStatus: SyncStatus;
  abstractionStatus: AbstractionStatus;
  privacyStatus: PrivacyStatus;
  archiveStatus: ArchiveStatus;
  lastSyncResult?: {
    recordsSynced: number;
    recordsFailed: number;
    syncDuration: number;
    completedAt: string;
  };
  supportedFeatures?: string[];
  protocolVersion?: string;
}

export interface ScanResult {
  deviceId: string;
  name: string;
  brand: string;
  signalStrength: number;
  supportedProtocols: string[];
  supportedFeatures?: string[];
  rawSignalData?: {
    rssi: number;
    txPower?: number;
    advertisingData?: string;
  };
}

export interface VitalSigns {
  heartRate: number;
  hrv: number;
  bloodOxygen: number;
  stressIndex: number;
  restingHeartRate: number;
  timestamp: string;
}

export interface VitalRecord extends VitalSigns {
  id: string;
  userId: string;
  createdAt: string;
}

export interface SleepRecord {
  id: string;
  userId: string;
  date: string;
  totalTime: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeTime: number;
  noiseLevelAvg: number;
  noiseLevel: number[];
  qualityScore: number;
  stages: { stage: SleepStage; start: string; end: string; duration: number }[];
  createdAt: string;
}

export interface ExerciseTrajectoryPoint {
  lat: number;
  lng: number;
  hr: number;
  ts: string;
}

export interface ExerciseRecord {
  id: string;
  userId: string;
  type: string;
  startTime: string;
  duration: number;
  distance: number;
  calories: number;
  avgHeartRate: number;
  maxHeartRate: number;
  trajectory: ExerciseTrajectoryPoint[];
  heartRateZones: { zone: string; duration: number; percentage: number }[];
  createdAt: string;
}

export interface DailyPlan {
  day: string;
  dayName: string;
  exercises: {
    id: string;
    name: string;
    duration: number;
    intensity: ExerciseIntensity;
    completed: boolean;
  }[];
  completed: boolean;
  completionRate: number;
}

export interface ExercisePlan {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  dailyPlans: DailyPlan[];
  completionRate: number;
  recommendation: string;
  adaptiveReasoning: string;
}

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  value: number;
  threshold: number;
  startedAt: string;
  durationMinutes: number;
  status: AlertStatus;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dispositionStatus?: DispositionStatus;
  dispositionNote?: string;
  reviewScheduledAt?: string;
  reviewCompletedAt?: string;
  referralNeeded?: boolean;
  referralAppointmentId?: string;
  dismissedBy?: string;
  dismissedAt?: string;
  dismissReason?: string;
}

export interface AlertRule {
  id: string;
  userId: string;
  metric: string;
  metricName: string;
  condition: ConditionOperator;
  threshold: number;
  durationMinutes: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export interface HealthArchive {
  id: string;
  userId: string;
  dateStart: string;
  dateEnd: string;
  dataTypes: string[];
  format: "json" | "pdf";
  standard: string;
  generatedAt: string;
  filePath: string;
  downloadUrl: string;
  status: "generating" | "completed" | "failed";
}

export interface HISDepartment {
  id: string;
  name: string;
  description: string;
}

export interface HISDoctor {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  title: string;
  availableSlots: string[];
}

export interface HISAppointment {
  id: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export interface DataAuthorization {
  id: string;
  userId: string;
  targetOrg: string;
  targetOrgName: string;
  scope: string[];
  scopeDescription: string;
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface HealthScoreBreakdown {
  overall: number;
  sleep: number;
  activity: number;
  heart: number;
  stress: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T;
  total: number;
  page: number;
  pageSize: number;
}
