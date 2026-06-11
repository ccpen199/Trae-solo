export interface City {
  id: string;
  name: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  adcode: string;
}

export interface DataSourceContribution {
  id: string;
  name: string;
  type: 'official' | 'radar' | 'iot';
  status: 'online' | 'offline' | 'degraded' | 'circuit_break';
  qualityScore: number;
  weight: number;
  effectiveWeight: number;
  credibility: number;
  values: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
  };
  qualityChecks: {
    ruleId: string;
    ruleName: string;
    passed: boolean;
    actualValue: number;
    threshold: number | [number, number];
    operator: string;
  }[];
  circuitBreakReason?: string;
  circuitBreakTime?: string;
  anomalyValues?: { field: string; value: number; expected: string }[];
  reviewRecords?: { reviewer: string; action: string; time: string; comment: string }[];
  complianceStatus?: 'compliant' | 'warning' | 'non_compliant';
}

export interface CurrentWeather {
  cityId: string;
  cityName: string;
  temperature: number;
  feelsLike: number;
  weather: string;
  weatherCode: string;
  humidity: number;
  windDirection: string;
  windSpeed: number;
  windScale: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  precipitation: number;
  updateTime: string;
  dataSources: string[];
  sourceDetails: DataSourceContribution[];
}

export interface MinutelyPrecipitation {
  cityId: string;
  startTime: string;
  endTime: string;
  step: number;
  gridSize: number;
  precipitation: {
    time: string;
    value: number;
    gridData?: number[][];
  }[];
  summary: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weather: string;
  weatherCode: string;
  precipitation: number;
  windDirection: string;
  windSpeed: number;
  humidity: number;
}

export interface DailyForecast {
  date: string;
  dayWeather: string;
  nightWeather: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  precipitationProbability: number;
  windDirectionDay: string;
  windSpeedDay: number;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  credibility?: number;
  sourceContribution?: { sourceId: string; sourceName: string; weight: number }[];
  algorithmParams?: { uncertaintyFactor?: number; modelVersion?: string };
  anomalyNote?: string;
  reviewStatus?: 'normal' | 'warning' | 'reviewed';
}

export interface LifeIndex {
  type: LifeIndexType;
  name: string;
  value: number | string;
  level: string;
  levelCode: number;
  description: string;
  updateTime: string;
}

export type LifeIndexType = 
  | 'aqi' 
  | 'pm25' 
  | 'uv' 
  | 'feels_like' 
  | 'dressing' 
  | 'car_wash' 
  | 'sports' 
  | 'cold' 
  | 'drying' 
  | 'travel' 
  | 'traffic'
  | 'comfort';

export interface WeatherAlert {
  id: string;
  cityId: string;
  cityName: string;
  type: string;
  typeCode: string;
  level: string;
  levelCode: number;
  title: string;
  content: string;
  defenseGuide: string;
  startTime: string;
  endTime: string;
  publishTime: string;
  source: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'official' | 'radar' | 'iot';
  status: 'online' | 'offline' | 'degraded' | 'circuit_break';
  uptime: number;
  latency: number;
  successRate: number;
  qualityScore: number;
  lastUpdate: string;
  circuitBreakReason?: string;
  circuitBreakTime?: string;
}

export interface QualityRule {
  id: string;
  name: string;
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'range';
  threshold: number | [number, number];
  weight: number;
  enabled: boolean;
  description: string;
}

export interface IndexParameter {
  indexType: string;
  indexName: string;
  parameters: {
    key: string;
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    description: string;
  }[];
  version: string;
  updateTime: string;
}

export interface CircuitBreakLog {
  id: number;
  sourceId: string;
  action: 'break' | 'restore';
  reason: string;
  actionTime: string;
}

export interface ApiKey {
  id: string;
  keyName: string;
  apiKey: string;
  status: 'active' | 'inactive';
  rateLimit: number;
  callCount?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiCallStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  topEndpoints: { endpoint: string; count: number }[];
  dailyStats: { date: string; count: number }[];
}

export interface HistoryDataPoint {
  date: string;
  temperature: number;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface AuditLog {
  id: number;
  operator: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

export interface ComplianceReport {
  serviceName: string;
  version: string;
  dataSources: {
    name: string;
    status: string;
    qualityScore: number;
    complianceLevel: string;
  }[];
  qualityRules: {
    id: string;
    name: string;
    enabled: boolean;
    passRate: number;
  }[];
  indices: {
    type: string;
    name: string;
    version: string;
    lastUpdate: string;
  }[];
  lastCheckTime: string;
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}
