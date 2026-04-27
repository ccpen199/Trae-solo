import { v4 as uuidv4 } from 'uuid';
import { DissolvedOxygenTrend, SensorData, Alert } from '../types';

export interface DOEngineConfig {
  declineRateThreshold: number;
  criticalThreshold: number;
  stableRange: [number, number];
  samplingInterval: number;
  operator: string;
}

export const DEFAULT_DO_CONFIG: DOEngineConfig = {
  declineRateThreshold: 0.5,
  criticalThreshold: 1.0,
  stableRange: [5.0, 8.0],
  samplingInterval: 30000,
  operator: 'DO-Analysis-Engine'
};

export class DissolvedOxygenAnalysisEngine {
  private config: DOEngineConfig;
  private sensorHistory: Map<string, SensorData[]> = new Map();
  private currentTrends: Map<string, DissolvedOxygenTrend> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  constructor(config?: Partial<DOEngineConfig>) {
    this.config = { ...DEFAULT_DO_CONFIG, ...config };
  }

  processSensorData(data: SensorData): DissolvedOxygenTrend {
    const history = this.sensorHistory.get(data.pondId) || [];
    history.push(data);
    
    if (history.length > 10) {
      history.shift();
    }
    this.sensorHistory.set(data.pondId, history);

    const trend = this.analyzeTrend(data.pondId);
    this.currentTrends.set(data.pondId, trend);

    if (trend.isAbnormal) {
      this.generateAlert(trend);
    }

    return trend;
  }

  private analyzeTrend(pondId: string): DissolvedOxygenTrend {
    const history = this.sensorHistory.get(pondId) || [];
    const now = Date.now();
    
    if (history.length < 2) {
      return {
        pondId,
        currentValue: history[0]?.dissolvedOxygen || 0,
        previousValue: history[0]?.dissolvedOxygen || 0,
        declineRate: 0,
        isAbnormal: false,
        threshold: this.config.declineRateThreshold,
        analysisTime: now,
        status: 'stable',
        nextAction: this.getNextAction('stable', 0, history[0]?.dissolvedOxygen || 0)
      };
    }

    const currentData = history[history.length - 1];
    const previousData = history[history.length - 2];
    
    const timeDiffHours = (currentData.timestamp - previousData.timestamp) / (1000 * 60 * 60);
    const valueDiff = currentData.dissolvedOxygen - previousData.dissolvedOxygen;
    const declineRate = Math.abs(timeDiffHours > 0 ? valueDiff / timeDiffHours : 0);

    let status: DissolvedOxygenTrend['status'];
    let isAbnormal = false;

    if (declineRate >= this.config.criticalThreshold) {
      status = 'critical';
      isAbnormal = true;
    } else if (declineRate >= this.config.declineRateThreshold) {
      status = 'declining';
      isAbnormal = true;
    } else {
      status = 'stable';
    }

    return {
      pondId,
      currentValue: currentData.dissolvedOxygen,
      previousValue: previousData.dissolvedOxygen,
      declineRate,
      isAbnormal,
      threshold: this.config.declineRateThreshold,
      analysisTime: now,
      status,
      nextAction: this.getNextAction(status, declineRate, currentData.dissolvedOxygen)
    };
  }

  private getNextAction(
    status: DissolvedOxygenTrend['status'],
    declineRate: number,
    currentValue: number
  ): string {
    switch (status) {
      case 'critical':
        if (currentValue < 4.0) {
          return '立即启动所有应急增氧设备，同时通知值班管理员进行人工干预';
        }
        return '启动应急增氧设备，密切监测溶氧变化，准备人工干预预案';
      case 'declining':
        if (currentValue < 5.0) {
          return '建议启动1号增氧机，持续监测溶氧下降趋势';
        }
        return '持续监测溶氧变化，准备增氧机待命';
      case 'stable':
        if (currentValue < 5.0) {
          return '溶氧值偏低，建议在低谷电价时段适当增氧';
        }
        return '溶氧水平正常，继续常规监测';
      default:
        return '继续常规监测';
    }
  }

  private generateAlert(trend: DissolvedOxygenTrend): void {
    const alert: Alert = {
      id: uuidv4(),
      type: trend.status === 'critical' ? 'critical' : 'warning',
      level: trend.status === 'critical' ? 'red' : 'orange',
      message: `塘口${trend.pondId}溶氧异常：当前值${trend.currentValue.toFixed(1)}mg/L，下降速率${trend.declineRate.toFixed(2)}mg/L/小时`,
      source: 'DissolvedOxygenAnalysisEngine',
      operator: this.config.operator,
      createdAt: trend.analysisTime,
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: trend.nextAction
    };

    this.alertCallbacks.forEach(callback => callback(alert));
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  getTrend(pondId: string): DissolvedOxygenTrend | undefined {
    return this.currentTrends.get(pondId);
  }

  getAllTrends(): DissolvedOxygenTrend[] {
    return Array.from(this.currentTrends.values());
  }

  getHistory(pondId: string): SensorData[] {
    return this.sensorHistory.get(pondId) || [];
  }

  updateConfig(config: Partial<DOEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DOEngineConfig {
    return { ...this.config };
  }
}
