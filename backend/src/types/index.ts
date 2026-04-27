export interface SensorData {
  id: string;
  pondId: string;
  timestamp: number;
  ammoniaNitrogen: number;
  nitrite: number;
  dissolvedOxygen: number;
  temperature: number;
  source: string;
  operator: string;
}

export interface DissolvedOxygenTrend {
  pondId: string;
  currentValue: number;
  previousValue: number;
  declineRate: number;
  isAbnormal: boolean;
  threshold: number;
  analysisTime: number;
  status: 'stable' | 'declining' | 'critical';
  nextAction: string;
}

export interface AerationPlan {
  id: string;
  pondId: string;
  startTime: number;
  endTime: number;
  powerCost: number;
  energyEfficiency: number;
  waterLoad: number;
  suggestedBy: string;
  approvedBy: string | null;
  status: 'pending' | 'approved' | 'executing' | 'completed';
  controlSequence: ControlSequence[];
}

export interface ControlSequence {
  action: 'start' | 'stop';
  deviceId: string;
  delaySeconds: number;
}

export interface PowerStatus {
  isPowered: boolean;
  lastPowerTime: number;
  backupPowerStatus: 'idle' | 'ready' | 'active';
  operator: string;
  nextAction: string;
}

export interface FeedingPlan {
  id: string;
  pondId: string;
  targetAmount: number;
  actualAmount: number;
  temperature: number;
  feedingFrequency: number;
  acousticData: AcousticData;
  lastFeedingTime: number;
  nextFeedingTime: number;
  suggestedBy: string;
  operator: string;
  status: 'pending' | 'active' | 'completed';
}

export interface AcousticData {
  feedingIntensity: number;
  frequencyBand: number;
  analysisTime: number;
  interpretation: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  level: 'orange' | 'red' | 'blue';
  message: string;
  source: string;
  operator: string;
  createdAt: number;
  acknowledgedAt: number | null;
  acknowledgedBy: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  nextAction: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'aerator' | 'feeder' | 'gate' | 'sensor';
  pondId: string;
  status: 'online' | 'offline' | 'error';
  lastCheckTime: number;
  operator: string;
  nextAction: string;
}

export interface Pond {
  id: string;
  name: string;
  area: number;
  depth: number;
  currentStatus: 'normal' | 'warning' | 'emergency';
  operator: string;
  nextAction: string;
}

export interface BusinessNode {
  id: string;
  name: string;
  description: string;
  source: string;
  responsiblePerson: string;
  currentStatus: string;
  nextAction: string;
  lastUpdateTime: number;
  dependencies: string[];
  affectedNodes: string[];
}

export interface PowerSwitchPlan {
  id: string;
  pondId: string;
  triggerType: 'scheduled' | 'emergency';
  sourcePower: 'main' | 'backup';
  targetPower: 'main' | 'backup';
  switchTime: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executedBy: string;
  nextAction: string;
}

export interface WaterQualityReport {
  id: string;
  pondId: string;
  reportTime: number;
  ammoniaNitrogen: number;
  nitrite: number;
  dissolvedOxygen: number;
  temperature: number;
  overallScore: number;
  recommendations: string[];
  generatedBy: string;
  nextAction: string;
}
