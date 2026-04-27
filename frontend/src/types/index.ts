export interface Crop {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalGrowthDays?: number;
  optimalSeason?: string;
  optimalSoilPh?: { min: number; max: number };
  createdAt: Date;
  updatedAt: Date;
}

export enum GrowthStageType {
  SEEDLING = 'seedling',
  VEGETATIVE = 'vegetative',
  FLOWERING = 'flowering',
  FRUITING = 'fruiting',
  RIPENING = 'ripening',
  HARVEST = 'harvest',
}

export interface GrowthStage {
  id: string;
  name: string;
  stageType: GrowthStageType;
  startDay: number;
  endDay: number;
  description?: string;
  orderIndex: number;
  cropId: string;
  crop?: Crop;
  createdAt: Date;
  updatedAt: Date;
}

export enum EnvironmentParameter {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  SOIL_MOISTURE = 'soil_moisture',
  SOIL_PH = 'soil_ph',
  LIGHT_INTENSITY = 'light_intensity',
  CO2_LEVEL = 'co2_level',
  WIND_SPEED = 'wind_speed',
  RAINFALL = 'rainfall',
}

export enum ThresholdType {
  WARNING = 'warning',
  CRITICAL = 'critical',
  OPTIMAL = 'optimal',
}

export interface EnvironmentThreshold {
  id: string;
  parameterType: EnvironmentParameter;
  thresholdType: ThresholdType;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  recommendation?: string;
  growthStageId: string;
  growthStage?: GrowthStage;
  createdAt: Date;
  updatedAt: Date;
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  SOIL_MOISTURE = 'soil_moisture',
  SOIL_PH = 'soil_ph',
  LIGHT_INTENSITY = 'light_intensity',
  CO2_SENSOR = 'co2_sensor',
  WIND_SPEED = 'wind_speed',
  RAINFALL = 'rainfall',
}

export enum SensorStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export interface Sensor {
  id: string;
  name: string;
  code: string;
  type: SensorType;
  status: SensorStatus;
  locationZone: string;
  installPositionX?: number;
  installPositionY?: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  accuracy?: number;
  lastCalibrationAt?: Date;
  lastHeartbeatAt?: Date;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum DataQuality {
  RAW = 'raw',
  FILTERED = 'filtered',
  VALIDATED = 'validated',
  ANOMALY = 'anomaly',
}

export interface SensorReading {
  id: string;
  rawValue: number;
  filteredValue?: number;
  timestamp: Date;
  dataQuality: DataQuality;
  isOutlier: boolean;
  filterComment?: string;
  metadata?: Record<string, any>;
  sensorId: string;
  sensor?: Sensor;
  createdAt: Date;
  updatedAt: Date;
}

export enum AlarmSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlarmStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
}

export enum AlarmType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  SENSOR_OFFLINE = 'sensor_offline',
  EQUIPMENT_FAILURE = 'equipment_failure',
  MAINTENANCE_REQUIRED = 'maintenance_required',
}

export interface Alarm {
  id: string;
  alarmType: AlarmType;
  severity: AlarmSeverity;
  status: AlarmStatus;
  title: string;
  description?: string;
  actualValue?: number;
  thresholdMin?: number;
  thresholdMax?: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  weatherForecast?: {
    predictedRain: boolean;
    rainProbability: number;
    hoursUntilRain: number;
    adjustedSeverity: AlarmSeverity;
    adjustmentReason: string;
  };
  isAdjusted: boolean;
  sensorId?: string;
  sensor?: Sensor;
  growthStageId?: string;
  growthStage?: GrowthStage;
  thresholdId?: string;
  threshold?: EnvironmentThreshold;
  createdAt: Date;
  updatedAt: Date;
}

export enum AlarmActionType {
  NOTIFICATION = 'notification',
  SUGGESTION = 'suggestion',
  AUTO_CONTROL = 'auto_control',
  MANUAL_CONFIRM = 'manual_confirm',
}

export enum AlarmActionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface AlarmAction {
  id: string;
  actionType: AlarmActionType;
  status: AlarmActionStatus;
  title: string;
  actionDetails?: string;
  recommendation?: string;
  requiresConfirmation: boolean;
  isConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;
  executedAt?: Date;
  executionResult?: string;
  pidParams?: {
    targetValue: number;
    kp: number;
    ki: number;
    kd: number;
    currentError: number;
    integralSum: number;
    derivativeTerm: number;
    output: number;
  };
  alarmId: string;
  alarm?: Alarm;
  controlCommandId?: string;
  controlCommand?: ControlCommand;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeviceType {
  IRRIGATION_VALVE = 'irrigation_valve',
  ROLLER_CURTAIN = 'roller_curtain',
  VENTILATION_FAN = 'ventilation_fan',
  HEATER = 'heater',
  HUMIDIFIER = 'humidifier',
  CO2_GENERATOR = 'co2_generator',
  LIGHT_SYSTEM = 'light_system',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  RUNNING = 'running',
  IDLE = 'idle',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export interface ControlDevice {
  id: string;
  name: string;
  code: string;
  type: DeviceType;
  status: DeviceStatus;
  locationZone: string;
  currentValue?: number;
  targetValue?: number;
  maxCapacity?: number;
  unit?: string;
  pidConfig?: {
    kp: number;
    ki: number;
    kd: number;
    outputMin: number;
    outputMax: number;
    integralMax: number;
  };
  deviceConfig?: Record<string, any>;
  lastOperatedAt?: Date;
  lastOperatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ControlCommandType {
  IRRIGATION = 'irrigation',
  ROLLER_CURTAIN = 'roller_curtain',
  VENTILATION = 'ventilation',
  HEATING = 'heating',
  HUMIDIFICATION = 'humidification',
  CO2_CONTROL = 'co2_control',
  LIGHTING = 'lighting',
}

export enum ControlCommandStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ControlSource {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  ALARM_TRIGGERED = 'alarm_triggered',
}

export interface ControlCommand {
  id: string;
  commandType: ControlCommandType;
  status: ControlCommandStatus;
  source: ControlSource;
  targetValue?: number;
  durationSeconds?: number;
  flowRate?: number;
  isPidControlled: boolean;
  pidResult?: {
    targetValue: number;
    currentValue: number;
    kp: number;
    ki: number;
    kd: number;
    error: number;
    integralSum: number;
    derivative: number;
    output: number;
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  operatorId?: string;
  operatorName?: string;
  reason?: string;
  executionNotes?: string;
  feedbackData?: Record<string, any>;
  deviceId: string;
  device?: ControlDevice;
  farmingRecordId?: string;
  farmingRecord?: FarmingRecord;
  createdAt: Date;
  updatedAt: Date;
}

export enum FarmingRecordType {
  IRRIGATION = 'irrigation',
  FERTILIZATION = 'fertilization',
  PEST_CONTROL = 'pest_control',
  PRUNING = 'pruning',
  HARVEST = 'harvest',
  PLANTING = 'planting',
  TRANSPLANTING = 'transplanting',
  OTHER = 'other',
}

export enum HarvestQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor',
}

export interface FarmingRecord {
  id: string;
  recordType: FarmingRecordType;
  title: string;
  description?: string;
  occurredAt: Date;
  locationZone: string;
  growthDay?: number;
  quantity?: number;
  quantityUnit?: string;
  operatorId?: string;
  operatorName?: string;
  harvestQuality?: HarvestQuality;
  yieldPerHectare?: number;
  environmentSnapshot?: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    soilPh: number;
    lightIntensity: number;
    co2Level: number;
  };
  additionalData?: Record<string, any>;
  cropId?: string;
  crop?: Crop;
  growthStageId?: string;
  growthStage?: GrowthStage;
  createdAt: Date;
  updatedAt: Date;
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface HighYieldAnalysis {
  id: string;
  title: string;
  description?: string;
  status: AnalysisStatus;
  targetYieldPerHectare: number;
  actualYieldPerHectare?: number;
  startGrowthDay?: number;
  endGrowthDay?: number;
  optimalEnvironmentProfile?: {
    temperature: { min: number; max: number; optimal: number };
    humidity: { min: number; max: number; optimal: number };
    soilMoisture: { min: number; max: number; optimal: number };
    soilPh: { min: number; max: number; optimal: number };
    lightIntensity: { min: number; max: number; optimal: number };
    co2Level: { min: number; max: number; optimal: number };
  };
  irrigationPattern?: {
    frequencyPerDay: number;
    durationPerIrrigation: number;
    totalVolumePerDay: number;
    timingWindows: string[];
  };
  fertilizationSchedule?: {
    growthDay: number;
    fertilizerType: string;
    quantity: number;
    unit: string;
  }[];
  pestControlActions?: {
    growthDay: number;
    pestType: string;
    controlMethod: string;
    chemicalName: string;
  }[];
  keySuccessFactors?: {
    factor: string;
    importance: number;
    description: string;
  }[];
  growthStageAnalysis?: {
    stageType: string;
    durationDays: number;
    environmentStats: Record<string, any>;
    keyActions: string[];
  }[];
  recommendations?: string;
  isStandardized: boolean;
  analyzedAt?: Date;
  referenceRecordId?: string;
  referenceRecord?: FarmingRecord;
  cropId?: string;
  crop?: Crop;
  growthStageId?: string;
  growthStage?: GrowthStage;
  createdAt: Date;
  updatedAt: Date;
}

export enum ModelStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

export interface StandardizedModel {
  id: string;
  name: string;
  code: string;
  description?: string;
  targetYieldPerHectare: number;
  totalGrowthDays: number;
  optimalRegion?: string;
  status: ModelStatus;
  growthStageConfigs?: {
    stageType: string;
    stageName: string;
    startDay: number;
    endDay: number;
    durationDays: number;
    environmentThresholds: {
      parameterType: string;
      thresholdType: string;
      minValue: number;
      maxValue: number;
      optimalValue: number;
      unit: string;
    }[];
    keyActions: {
      actionType: string;
      actionName: string;
      recommendedDay: number;
      details: string;
    }[];
  }[];
  irrigationSchedule?: {
    stageType: string;
    frequencyPerDay: number;
    durationPerIrrigation: number;
    targetSoilMoisture: number;
    timingWindows: string[];
  }[];
  fertilizationSchedule?: {
    stageType: string;
    growthDay: number;
    fertilizerType: string;
    quantity: number;
    unit: string;
    applicationMethod: string;
  }[];
  pestControlGuidelines?: {
    stageType: string;
    commonPests: string[];
    preventionMethods: string[];
    treatmentOptions: {
      pestType: string;
      chemicalName: string;
      dosage: string;
      safetyPeriod: number;
    }[];
  }[];
  environmentalControls?: {
    stageType: string;
    temperatureControl: {
      enabled: boolean;
      targetMin: number;
      targetMax: number;
      heatingThreshold: number;
      coolingThreshold: number;
    };
    humidityControl: {
      enabled: boolean;
      targetMin: number;
      targetMax: number;
      humidificationThreshold: number;
      dehumidificationThreshold: number;
    };
    lightControl: {
      enabled: boolean;
      targetLightHours: number;
      supplementalLighting: boolean;
    };
    co2Control: {
      enabled: boolean;
      targetCo2Level: number;
    };
  }[];
  keySuccessFactors?: string;
  riskWarnings?: string;
  usageCount: number;
  averageYieldRatio?: number;
  cropId?: string;
  crop?: Crop;
  createdAt: Date;
  updatedAt: Date;
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditResourceType {
  CROP = 'crop',
  GROWTH_STAGE = 'growth_stage',
  THRESHOLD = 'threshold',
  SENSOR = 'sensor',
  SENSOR_READING = 'sensor_reading',
  ALARM = 'alarm',
  CONTROL_DEVICE = 'control_device',
  CONTROL_COMMAND = 'control_command',
  FARMING_RECORD = 'farming_record',
  HIGH_YIELD_ANALYSIS = 'high_yield_analysis',
  STANDARDIZED_MODEL = 'standardized_model',
  USER = 'user',
  SETTINGS = 'settings',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName: string;
  result: AuditResult;
  actionedAt: Date;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  clientIp?: string;
  userAgent?: string;
  module?: string;
  description?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  errorMessage?: string;
  relatedAlarmId?: string;
  relatedCommandId?: string;
  relatedRecordId?: string;
  createdAt: Date;
  updatedAt: Date;
}
