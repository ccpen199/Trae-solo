export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  micAuthorized: boolean;
  motionAuthorized: boolean;
  dataLocalOnly: boolean;
  medicalShareAllowed: boolean;
  notificationEnabled: boolean;
  targetSleepDuration: number;
  targetBedTime: string;
  targetWakeTime: string;
}

export type SleepStageType = 'awake' | 'light' | 'deep' | 'rem';

export interface SleepStage {
  stage: SleepStageType;
  startTime: number;
  duration: number;
  confidence: number;
}

export interface BreathingMetrics {
  avgRate: number;
  minRate: number;
  maxRate: number;
  rateSeries: { time: number; value: number }[];
  regularity: number;
}

export interface MovementMetrics {
  totalTurns: number;
  movementIntensity: { time: number; value: number }[];
  restlessPeriods: { start: number; end: number; intensity: number }[];
}

export interface SnoringMetrics {
  totalEpisodes: number;
  totalDuration: number;
  avgLoudness: number;
  spectrumHeatmap: number[][];
  frequencyBands: { band: string; energy: number }[];
}

export type ApneaType = 'obstructive' | 'central' | 'mixed' | 'suspected';
export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface ApneaEvent {
  id: string;
  startTime: number;
  duration: number;
  type: ApneaType;
  severity: SeverityLevel;
  oxygenDrop?: number;
  confidence: number;
}

export interface SleepSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  sleepEfficiency: number;
  sleepLatency: number;
  sleepStages: SleepStage[];
  breathingMetrics: BreathingMetrics;
  movementMetrics: MovementMetrics;
  snoringMetrics: SnoringMetrics;
  apneaEvents: ApneaEvent[];
  ahiIndex: number;
  environmentNoise: number;
  qualityScore: number;
  auditInfo: SleepSessionAudit;
}

export interface SleepSessionAudit {
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  storageVersion: string;
  dataFingerprint: string;
  createdAt: string;
  lastModifiedAt: string;
  deviceModel: string;
  appVersion: string;
  checksum: string;
}

export interface MorningAssessment {
  id: string;
  sessionId: string;
  userId: string;
  assessedAt: string;
  alertness: number;
  sleepQuality: number;
  mood: number;
  thoughtInterference: number;
  notes?: string;
}

export type AudioCategory = 'anxiety' | 'stress' | 'insomnia' | 'meditation';

export interface CopyrightInfo {
  contentId: string;
  watermarkId: string;
  licenseType: string;
  copyrightHolder: string;
  royaltyInfo: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  duration: number;
  category: AudioCategory;
  tags: string[];
  author: string;
  copyrightInfo: CopyrightInfo;
  playCount: number;
  favorited: boolean;
  audioUrl: string;
  watermarkEmbedded: boolean;
}

export interface WatermarkLog {
  id: string;
  audioId: string;
  userId: string;
  playedAt: string;
  duration: number;
  watermarkId: string;
  deviceFingerprint: string;
}

export type CBTType = 'sleep_restriction' | 'stimulus_control' | 'cognitive_restructuring' | 'relaxation';
export type CBTExerciseType = 'thought_record' | 'behavior_checklist' | 'breathing' | 'progressive_relaxation';

export interface CBTExercise {
  type: CBTExerciseType;
  prompts: string[];
  userInput?: Record<string, string>;
}

export interface CBTSession {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  exercise?: CBTExercise;
}

export interface CBTModule {
  id: string;
  type: CBTType;
  title: string;
  description: string;
  progress: number;
  sessions: CBTSession[];
}

export interface SleepRestrictionConfig {
  currentBedTime: string;
  targetBedTime: string;
  currentWakeTime: string;
  targetWakeTime: string;
  weeklyAdjustMinutes: number;
  sleepEfficiencyThreshold: number;
}

export type DailyTaskType = 'schedule' | 'cbt' | 'audio' | 'assessment' | 'habit';

export interface DailyTask {
  id: string;
  date: string;
  type: DailyTaskType;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  rewardPoints: number;
}

export type PlanStatus = 'active' | 'completed' | 'paused';

export interface SleepImprovementPlan {
  id: string;
  userId: string;
  startDate: string;
  durationWeeks: number;
  status: PlanStatus;
  sleepRestriction: SleepRestrictionConfig;
  cbtModules: CBTModule[];
  tasks: DailyTask[];
  totalPoints: number;
  streakDays: number;
}

export type DSMDisorder = 'insomnia' | 'osa' | 'restless_legs' | 'periodic_limb' | 'narcolepsy' | 'circadian_rhythm';
export type RiskLevel = 'low' | 'moderate' | 'high';

export interface DSM5Dimension {
  disorder: DSMDisorder;
  dsm5Code: string;
  riskLevel: RiskLevel;
  score: number;
  threshold: number;
  evidences: string[];
  diagnosticCriteriaMet: string[];
}

export type AHISeverity = 'normal' | 'mild' | 'moderate' | 'severe';

export interface AHIRisk {
  ahiValue: number;
  eventsCount: number;
  severity: AHISeverity;
  threshold: number;
}

export interface RiskAssessment {
  id: string;
  sessionId?: string;
  userId: string;
  icd10Code: string;
  assessedAt: string;
  overallRisk: RiskLevel;
  dsm5Mapping: DSM5Dimension[];
  ahiBasedRisk?: AHIRisk;
  referralTriggered: boolean;
  recommendations: string[];
  dsm5Evidence: DSM5MappingEvidence[];
  auditInfo: {
    assessmentId: string;
    assessor: string;
    assessedAt: string;
    lastModifiedAt: string;
    version: string;
    signature: string;
  };
}

export type ReferralStatus =
  | 'pending_auth'
  | 'data_packaging'
  | 'report_generated'
  | 'hospital_matched'
  | 'appointment_scheduled'
  | 'consultation_completed';

export interface HospitalInfo {
  id: string;
  name: string;
  department: string;
  city: string;
  level: string;
  cooperationType: string;
  logo?: string;
  doctorsCount: number;
  rating: number;
}

export type ConsultationType = 'video' | 'phone' | 'onsite';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface AppointmentInfo {
  id: string;
  scheduledAt: string;
  doctorName: string;
  consultationType: ConsultationType;
  meetingLink?: string;
  status: AppointmentStatus;
  duration: number;
}

export interface ReferralRecord {
  id: string;
  userId: string;
  assessmentId: string;
  sessionId: string;
  createdAt: string;
  status: ReferralStatus;
  consentGiven: boolean;
  consentGivenAt?: string;
  reportId?: string;
  matchedHospital?: HospitalInfo;
  appointment?: AppointmentInfo;
  consultationResult?: string;
  auditTrail?: ReferralAuditEntry[];
  packagingInfo?: ReferralPackagingInfo;
}

export interface ReferralAuditEntry {
  id: string;
  status: ReferralStatus;
  timestamp: string;
  operator: string;
  note: string;
  signature?: string;
}

export interface ReferralPackagingInfo {
  packageId: string;
  encrypted: boolean;
  encryptionAlgorithm: string;
  dataIncluded: string[];
  dataSize: number;
  packagedAt: string;
  checksum: string;
}

export interface DSM5MappingEvidence {
  dimensionId: string;
  symptom: string;
  frequency: string;
  duration: string;
  impairment: string;
  dsm5Reference: string;
}

export interface SleepSessionAudit {
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  storageVersion: string;
  dataFingerprint: string;
  createdAt: string;
  lastModifiedAt: string;
  deviceModel: string;
  appVersion: string;
  checksum: string;
}

export type SensorStatus = 'idle' | 'connecting' | 'active' | 'error' | 'denied';

export interface RealtimeMonitorData {
  micLevel: number;
  micStatus: SensorStatus;
  motionLevel: number;
  motionStatus: SensorStatus;
  breathingRate: number;
  isMonitoring: boolean;
  elapsedSeconds: number;
  environmentNoise: number;
  waveBuffer: { breathing: number[]; motion: number[] };
}
