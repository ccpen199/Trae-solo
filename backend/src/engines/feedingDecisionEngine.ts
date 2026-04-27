import { v4 as uuidv4 } from 'uuid';
import { FeedingPlan, AcousticData, Alert, SensorData } from '../types';

export interface FeedingConfig {
  baseFeedingAmountPerKg: number;
  temperatureOptimalRange: [number, number];
  feedingIntensityThreshold: number;
  minFeedingIntervalHours: number;
  maxDailyFeedings: number;
  waterQualityWeight: {
    ammoniaNitrogen: number;
    nitrite: number;
    dissolvedOxygen: number;
  };
  operator: string;
}

export const DEFAULT_FEEDING_CONFIG: FeedingConfig = {
  baseFeedingAmountPerKg: 0.03,
  temperatureOptimalRange: [20, 30],
  feedingIntensityThreshold: 0.5,
  minFeedingIntervalHours: 4,
  maxDailyFeedings: 4,
  waterQualityWeight: {
    ammoniaNitrogen: 0.3,
    nitrite: 0.3,
    dissolvedOxygen: 0.4
  },
  operator: 'Feeding-Decision-Engine'
};

export interface PondEnvironment {
  pondId: string;
  fishWeight: number;
  fishCount: number;
  waterTemperature: number;
  waterQualityScore: number;
}

export interface AcousticSensorData {
  pondId: string;
  timestamp: number;
  frequencyData: number[];
  intensityData: number[];
  source: string;
}

export interface FeedingHistoryEntry {
  id: string;
  pondId: string;
  amount: number;
  timestamp: number;
  acousticIntensity: number;
  waterTemperature: number;
  efficiency: number;
}

export class FeedingDecisionEngine {
  private config: FeedingConfig;
  private feedingPlans: Map<string, FeedingPlan> = new Map();
  private feedingHistory: Map<string, FeedingHistoryEntry[]> = new Map();
  private acousticDataCache: Map<string, AcousticData> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private feedingCallbacks: ((plan: FeedingPlan) => void)[] = [];

  constructor(config?: Partial<FeedingConfig>) {
    this.config = { ...DEFAULT_FEEDING_CONFIG, ...config };
  }

  analyzeAcousticData(data: AcousticSensorData): AcousticData {
    const { intensityData, frequencyData } = data;
    
    if (intensityData.length === 0 || frequencyData.length === 0) {
      return {
        feedingIntensity: 0,
        frequencyBand: 0,
        analysisTime: data.timestamp,
        interpretation: '数据不足，无法分析摄食行为'
      };
    }

    const avgIntensity = intensityData.reduce((a, b) => a + b, 0) / intensityData.length;
    const maxFreqIndex = intensityData.indexOf(Math.max(...intensityData));
    const dominantFrequency = frequencyData[maxFreqIndex] || 0;

    let interpretation: string;
    if (avgIntensity > 0.8) {
      interpretation = '摄食活动活跃，鱼类食欲旺盛';
    } else if (avgIntensity > 0.5) {
      interpretation = '摄食活动正常，鱼类食欲一般';
    } else if (avgIntensity > 0.2) {
      interpretation = '摄食活动较弱，可能环境不适或饱食';
    } else {
      interpretation = '摄食活动几乎停止，需检查环境条件或鱼类健康';
    }

    const acousticResult: AcousticData = {
      feedingIntensity: avgIntensity,
      frequencyBand: dominantFrequency,
      analysisTime: data.timestamp,
      interpretation
    };

    this.acousticDataCache.set(data.pondId, acousticResult);

    return acousticResult;
  }

  calculateOptimalFeeding(
    env: PondEnvironment,
    acousticData?: AcousticData
  ): FeedingPlan {
    const now = Date.now();
    const history = this.feedingHistory.get(env.pondId) || [];

    const baseAmount = this.calculateBaseAmount(env.fishWeight);
    const tempMultiplier = this.calculateTemperatureMultiplier(env.waterTemperature);
    const qualityMultiplier = this.calculateWaterQualityMultiplier(env.waterQualityScore);
    const acousticMultiplier = acousticData ? this.calculateAcousticMultiplier(acousticData) : 1;

    const adjustedAmount = baseAmount * tempMultiplier * qualityMultiplier * acousticMultiplier;

    const lastFeeding = history[history.length - 1];
    const nextFeedingTime = this.calculateNextFeedingTime(lastFeeding, env);

    const feedingFrequency = this.calculateFeedingFrequency(
      env.waterTemperature,
      acousticData?.feedingIntensity || 0.5
    );

    const plan: FeedingPlan = {
      id: uuidv4(),
      pondId: env.pondId,
      targetAmount: Math.round(adjustedAmount * 100) / 100,
      actualAmount: 0,
      temperature: env.waterTemperature,
      feedingFrequency,
      acousticData: acousticData || {
        feedingIntensity: 0.5,
        frequencyBand: 0,
        analysisTime: now,
        interpretation: '无声学数据，使用默认值'
      },
      lastFeedingTime: lastFeeding?.timestamp || 0,
      nextFeedingTime,
      suggestedBy: this.config.operator,
      operator: this.config.operator,
      status: 'pending'
    };

    this.feedingPlans.set(plan.id, plan);

    if (this.needsAdjustment(plan, history)) {
      this.generateAdjustmentAlert(plan);
    }

    return plan;
  }

  private calculateBaseAmount(fishWeight: number): number {
    return fishWeight * this.config.baseFeedingAmountPerKg;
  }

  private calculateTemperatureMultiplier(temperature: number): number {
    const [minOptimal, maxOptimal] = this.config.temperatureOptimalRange;
    
    if (temperature < 15) {
      return 0.3;
    } else if (temperature < minOptimal) {
      return 0.6;
    } else if (temperature <= maxOptimal) {
      return 1.0;
    } else if (temperature <= 35) {
      return 0.8;
    } else {
      return 0.4;
    }
  }

  private calculateWaterQualityMultiplier(score: number): number {
    if (score >= 90) {
      return 1.1;
    } else if (score >= 70) {
      return 1.0;
    } else if (score >= 50) {
      return 0.7;
    } else {
      return 0.4;
    }
  }

  private calculateAcousticMultiplier(acousticData: AcousticData): number {
    const intensity = acousticData.feedingIntensity;
    
    if (intensity > 0.8) {
      return 1.2;
    } else if (intensity > 0.5) {
      return 1.0;
    } else if (intensity > 0.2) {
      return 0.6;
    } else {
      return 0.2;
    }
  }

  private calculateNextFeedingTime(
    lastFeeding: FeedingHistoryEntry | undefined,
    env: PondEnvironment
  ): number {
    const now = Date.now();
    
    if (!lastFeeding) {
      return now;
    }

    const minInterval = this.config.minFeedingIntervalHours * 60 * 60 * 1000;
    const tempMultiplier = this.calculateTemperatureMultiplier(env.waterTemperature);
    
    const actualInterval = minInterval / Math.max(tempMultiplier, 0.5);
    const nextTime = lastFeeding.timestamp + actualInterval;

    return Math.max(nextTime, now);
  }

  private calculateFeedingFrequency(
    temperature: number,
    feedingIntensity: number
  ): number {
    let baseFrequency: number;
    
    if (temperature < 15) {
      baseFrequency = 1;
    } else if (temperature < 20) {
      baseFrequency = 2;
    } else if (temperature <= 30) {
      baseFrequency = 3;
    } else {
      baseFrequency = 2;
    }

    const intensityAdjustment = feedingIntensity > 0.7 ? 1 : feedingIntensity > 0.3 ? 0 : -1;
    
    return Math.max(1, Math.min(this.config.maxDailyFeedings, baseFrequency + intensityAdjustment));
  }

  private needsAdjustment(plan: FeedingPlan, history: FeedingHistoryEntry[]): boolean {
    if (history.length < 2) {
      return false;
    }

    const recentHistory = history.slice(-5);
    const avgEfficiency = recentHistory.reduce((sum, entry) => sum + entry.efficiency, 0) / recentHistory.length;

    if (avgEfficiency < 0.3) {
      return true;
    }

    if (plan.targetAmount < 0.1 * this.calculateBaseAmount(100)) {
      return true;
    }

    return false;
  }

  private generateAdjustmentAlert(plan: FeedingPlan): void {
    const alert: Alert = {
      id: uuidv4(),
      type: 'info',
      level: 'blue',
      message: `塘口${plan.pondId}投喂计划建议调整：当前建议投喂量${plan.targetAmount.toFixed(2)}kg，摄食频率${plan.feedingFrequency}次/天`,
      source: 'FeedingDecisionEngine',
      operator: this.config.operator,
      createdAt: Date.now(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: this.getNextAction(plan)
    };

    this.alertCallbacks.forEach(callback => callback(alert));
  }

  private getNextAction(plan: FeedingPlan): string {
    const intensity = plan.acousticData.feedingIntensity;
    const temp = plan.temperature;

    if (intensity < 0.2) {
      return `摄食活动极低（${(intensity * 100).toFixed(0)}%），水温${temp.toFixed(1)}℃。建议检查水质指标（氨氮、亚盐、溶氧），观察鱼类健康状况，必要时减少投喂量`;
    } else if (intensity < 0.5) {
      return `摄食活动较弱（${(intensity * 100).toFixed(0)}%），水温${temp.toFixed(1)}℃。建议减少投喂量${Math.round((1 - intensity) * 50)}%，监测溶氧水平，检查是否有水质问题`;
    } else if (intensity > 0.8) {
      return `摄食活动活跃（${(intensity * 100).toFixed(0)}%），水温${temp.toFixed(1)}℃。可适当增加投喂量${Math.round((intensity - 0.8) * 100)}%，但注意观察水质变化，避免过饱导致水质恶化`;
    } else {
      return `摄食活动正常（${(intensity * 100).toFixed(0)}%），水温${temp.toFixed(1)}℃。按计划投喂${plan.targetAmount.toFixed(2)}kg，继续监测摄食行为和水质变化`;
    }
  }

  recordFeedingComplete(planId: string, actualAmount: number): void {
    const plan = this.feedingPlans.get(planId);
    if (!plan) {
      return;
    }

    plan.actualAmount = actualAmount;
    plan.status = 'completed';

    const historyEntry: FeedingHistoryEntry = {
      id: uuidv4(),
      pondId: plan.pondId,
      amount: actualAmount,
      timestamp: Date.now(),
      acousticIntensity: plan.acousticData.feedingIntensity,
      waterTemperature: plan.temperature,
      efficiency: this.calculateFeedingEfficiency(actualAmount, plan.targetAmount, plan.acousticData.feedingIntensity)
    };

    const history = this.feedingHistory.get(plan.pondId) || [];
    history.push(historyEntry);
    if (history.length > 50) {
      history.shift();
    }
    this.feedingHistory.set(plan.pondId, history);
  }

  private calculateFeedingEfficiency(
    actualAmount: number,
    targetAmount: number,
    feedingIntensity: number
  ): number {
    const amountRatio = actualAmount > 0 ? targetAmount / actualAmount : 0;
    const efficiency = amountRatio * feedingIntensity;
    return Math.min(1, Math.max(0, efficiency));
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  onFeedingPlan(callback: (plan: FeedingPlan) => void): void {
    this.feedingCallbacks.push(callback);
  }

  getFeedingPlan(planId: string): FeedingPlan | undefined {
    return this.feedingPlans.get(planId);
  }

  getAllPlans(): FeedingPlan[] {
    return Array.from(this.feedingPlans.values());
  }

  getFeedingHistory(pondId: string): FeedingHistoryEntry[] {
    return this.feedingHistory.get(pondId) || [];
  }

  getCachedAcousticData(pondId: string): AcousticData | undefined {
    return this.acousticDataCache.get(pondId);
  }

  updateConfig(config: Partial<FeedingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FeedingConfig {
    return { ...this.config };
  }

  approveFeedingPlan(planId: string, operator: string): void {
    const plan = this.feedingPlans.get(planId);
    if (plan) {
      plan.suggestedBy = operator;
      plan.status = 'active';
      this.feedingCallbacks.forEach(callback => callback(plan));
    }
  }
}
