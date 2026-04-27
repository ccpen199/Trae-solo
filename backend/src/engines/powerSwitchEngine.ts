import { v4 as uuidv4 } from 'uuid';
import { PowerStatus, PowerSwitchPlan, Alert } from '../types';

export interface PowerSwitchConfig {
  checkInterval: number;
  backupPowerWarmupTime: number;
  powerLossThreshold: number;
  emergencyWaterGateOpenDelay: number;
  operator: string;
}

export const DEFAULT_POWER_CONFIG: PowerSwitchConfig = {
  checkInterval: 1000,
  backupPowerWarmupTime: 5000,
  powerLossThreshold: 2000,
  emergencyWaterGateOpenDelay: 1000,
  operator: 'Power-Switch-Engine'
};

export interface PowerMonitorData {
  isPowered: boolean;
  voltage: number;
  current: number;
  timestamp: number;
  source: string;
}

export interface WaterGateState {
  isOpen: boolean;
  waterFlowRate: number;
  lastOperationTime: number;
}

export class PowerSwitchEngine {
  private config: PowerSwitchConfig;
  private powerStatus: PowerStatus;
  private waterGateState: WaterGateState;
  private powerHistory: PowerMonitorData[] = [];
  private switchPlans: Map<string, PowerSwitchPlan> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private gateCallbacks: ((action: 'open' | 'close') => void)[] = [];
  private switchCallbacks: ((plan: PowerSwitchPlan) => void)[] = [];

  constructor(config?: Partial<PowerSwitchConfig>) {
    this.config = { ...DEFAULT_POWER_CONFIG, ...config };
    this.powerStatus = {
      isPowered: true,
      lastPowerTime: Date.now(),
      backupPowerStatus: 'idle',
      operator: this.config.operator,
      nextAction: '监控主电源状态'
    };
    this.waterGateState = {
      isOpen: false,
      waterFlowRate: 0,
      lastOperationTime: 0
    };
  }

  processPowerData(data: PowerMonitorData): PowerStatus {
    this.powerHistory.push(data);
    if (this.powerHistory.length > 100) {
      this.powerHistory.shift();
    }

    const now = Date.now();
    
    if (!data.isPowered && this.powerStatus.isPowered) {
      this.handlePowerLoss(now);
    } else if (data.isPowered && !this.powerStatus.isPowered) {
        this.handlePowerRestore(now);
      }

    this.powerStatus.lastPowerTime = data.isPowered ? now : this.powerStatus.lastPowerTime;
    this.powerStatus.nextAction = this.getNextAction();

    return { ...this.powerStatus };
  }

  private handlePowerLoss(timestamp: number): void {
    this.powerStatus.isPowered = false;
    this.powerStatus.backupPowerStatus = 'ready';

    const emergencyPlan: PowerSwitchPlan = {
      id: uuidv4(),
      pondId: 'all',
      triggerType: 'emergency',
      sourcePower: 'main',
      targetPower: 'backup',
      switchTime: timestamp,
      status: 'executing',
      executedBy: this.config.operator,
      nextAction: '启动备用电源并开启应急供水闸机'
    };

    this.switchPlans.set(emergencyPlan.id, emergencyPlan);

    setTimeout(() => {
      this.powerStatus.backupPowerStatus = 'active';
      emergencyPlan.status = 'completed';
      this.openEmergencyGate();
    }, this.config.backupPowerWarmupTime);

    this.notifyPowerSwitch(emergencyPlan);

    const alert: Alert = {
      id: uuidv4(),
      type: 'critical',
      level: 'red',
      message: '检测到主电源断电！已启动备用电源和应急供水系统',
      source: 'PowerSwitchEngine',
      operator: this.config.operator,
      createdAt: timestamp,
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: '管理员请确认备用电源运行状态，检查应急供水系统'
    };

    this.alertCallbacks.forEach(callback => callback(alert));
  }

  private handlePowerRestore(timestamp: number): void {
    this.powerStatus.isPowered = true;
    this.powerStatus.backupPowerStatus = 'idle';

    const restorePlan: PowerSwitchPlan = {
      id: uuidv4(),
      pondId: 'all',
      triggerType: 'scheduled',
      sourcePower: 'backup',
      targetPower: 'main',
      switchTime: timestamp,
      status: 'executing',
      executedBy: this.config.operator,
      nextAction: '恢复主电源，关闭应急供水闸机'
    };

    this.switchPlans.set(restorePlan.id, restorePlan);

    setTimeout(() => {
      restorePlan.status = 'completed';
      this.closeEmergencyGate();
    }, 2000);

    this.notifyPowerSwitch(restorePlan);

    const alert: Alert = {
      id: uuidv4(),
      type: 'info',
      level: 'blue',
      message: '主电源已恢复，系统正在切换回主电源',
      source: 'PowerSwitchEngine',
      operator: this.config.operator,
      createdAt: timestamp,
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: '确认主电源运行稳定，关闭应急供水系统'
    };

    this.alertCallbacks.forEach(callback => callback(alert));
  }

  private openEmergencyGate(): void {
    setTimeout(() => {
      this.waterGateState.isOpen = true;
      this.waterGateState.waterFlowRate = 100;
      this.waterGateState.lastOperationTime = Date.now();
      this.gateCallbacks.forEach(callback => callback('open'));
    }, this.config.emergencyWaterGateOpenDelay);
  }

  private closeEmergencyGate(): void {
    setTimeout(() => {
      this.waterGateState.isOpen = false;
      this.waterGateState.waterFlowRate = 0;
      this.waterGateState.lastOperationTime = Date.now();
      this.gateCallbacks.forEach(callback => callback('close'));
    }, 1000);
  }

  private getNextAction(): string {
    if (!this.powerStatus.isPowered) {
      if (this.powerStatus.backupPowerStatus === 'active') {
        return '备用电源运行中，持续监控主电源恢复情况，应急供水闸机已开启';
      }
      return '主电源断电，备用电源正在启动中，准备开启应急供水闸机';
    }

    if (this.waterGateState.isOpen) {
      return '主电源已恢复，准备关闭应急供水闸机';
    }

    return '主电源运行正常，备用电源处于待命状态';
  }

  private notifyPowerSwitch(plan: PowerSwitchPlan): void {
    this.switchCallbacks.forEach(callback => callback(plan));
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  onGateAction(callback: (action: 'open' | 'close') => void): void {
    this.gateCallbacks.push(callback);
  }

  onPowerSwitch(callback: (plan: PowerSwitchPlan) => void): void {
    this.switchCallbacks.push(callback);
  }

  getPowerStatus(): PowerStatus {
    return { ...this.powerStatus };
  }

  getWaterGateState(): WaterGateState {
    return { ...this.waterGateState };
  }

  getSwitchPlans(): PowerSwitchPlan[] {
    return Array.from(this.switchPlans.values());
  }

  getPowerHistory(): PowerMonitorData[] {
    return [...this.powerHistory];
  }

  updateConfig(config: Partial<PowerSwitchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PowerSwitchConfig {
    return { ...this.config };
  }

  simulatePowerLoss(): void {
    const now = Date.now();
    this.handlePowerLoss(now);
  }

  simulatePowerRestore(): void {
    const now = Date.now();
    this.handlePowerRestore(now);
  }
}
