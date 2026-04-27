import { v4 as uuidv4 } from 'uuid';
import { AerationPlan, ControlSequence, Alert, BusinessNode, Device, DissolvedOxygenTrend } from '../types';

export interface ElectricityPrice {
  startTime: string;
  endTime: string;
  pricePerKWh: number;
  isPeak: boolean;
}

export interface AerationControlConfig {
  peakHours: ElectricityPrice[];
  valleyHours: ElectricityPrice[];
  normalHours: ElectricityPrice[];
  aeratorPowerKW: number;
  minAerationTimeMinutes: number;
  maxAerationTimeMinutes: number;
  targetDOLow: number;
  targetDOHigh: number;
  operator: string;
}

export const DEFAULT_AERATION_CONFIG: AerationControlConfig = {
  peakHours: [
    { startTime: '08:00', endTime: '11:00', pricePerKWh: 1.2, isPeak: true },
    { startTime: '18:00', endTime: '23:00', pricePerKWh: 1.2, isPeak: true }
  ],
  valleyHours: [
    { startTime: '00:00', endTime: '06:00', pricePerKWh: 0.3, isPeak: false }
  ],
  normalHours: [
    { startTime: '06:00', endTime: '08:00', pricePerKWh: 0.8, isPeak: false },
    { startTime: '11:00', endTime: '18:00', pricePerKWh: 0.8, isPeak: false },
    { startTime: '23:00', endTime: '24:00', pricePerKWh: 0.8, isPeak: false }
  ],
  aeratorPowerKW: 3.0,
  minAerationTimeMinutes: 30,
  maxAerationTimeMinutes: 120,
  targetDOLow: 5.0,
  targetDOHigh: 7.0,
  operator: 'Aeration-Control-Service'
};

export interface PondLoad {
  pondId: string;
  fishBiomass: number;
  temperature: number;
  currentDO: number;
  waterVolume: number;
}

export class AerationControlService {
  private config: AerationControlConfig;
  private aerationPlans: Map<string, AerationPlan> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private planCallbacks: ((plan: AerationPlan) => void)[] = [];
  private businessNodes: Map<string, BusinessNode> = new Map();
  private devices: Map<string, Device> = new Map();

  constructor(config?: Partial<AerationControlConfig>) {
    this.config = { ...DEFAULT_AERATION_CONFIG, ...config };
    this.initializeBusinessNodes();
    this.initializeDevices();
  }

  private initializeBusinessNodes(): void {
    const now = Date.now();

    this.businessNodes.set('aeration-planning', {
      id: 'aeration-planning',
      name: '增氧机运行规划',
      description: '根据电费时段和水体负荷，优化增氧机启停计划',
      source: '电费数据、水质数据',
      responsiblePerson: '节能管理员',
      currentStatus: '等待数据',
      nextAction: '等待水质和电费数据生成优化计划',
      lastUpdateTime: now,
      dependencies: ['do-trend-analysis', 'water-quality-analysis'],
      affectedNodes: ['aeration-control', 'energy-optimization']
    });

    this.businessNodes.set('aeration-control', {
      id: 'aeration-control',
      name: '增氧机控制执行',
      description: '执行增氧机启停控制序列',
      source: '增氧计划',
      responsiblePerson: '设备运维员',
      currentStatus: '待命',
      nextAction: '等待增氧计划审批后执行',
      lastUpdateTime: now,
      dependencies: ['aeration-planning'],
      affectedNodes: ['pond-oxygen-monitoring']
    });
  }

  private initializeDevices(): void {
    const now = Date.now();

    const aerator1: Device = {
      id: 'aerator-001',
      name: '1号增氧机',
      type: 'aerator',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    const aerator2: Device = {
      id: 'aerator-002',
      name: '2号增氧机',
      type: 'aerator',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    this.devices.set(aerator1.id, aerator1);
    this.devices.set(aerator2.id, aerator2);
  }

  calculateOptimalAerationPlan(
    pondLoad: PondLoad,
    doTrend?: DissolvedOxygenTrend
  ): AerationPlan {
    const now = Date.now();
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const priceInfo = this.getCurrentPriceInfo(currentHour, currentMinute);
    
    let aerationDuration = this.calculateAerationDuration(pondLoad, doTrend);
    
    const optimalStartTime = this.findOptimalStartTime(
      currentHour,
      currentMinute,
      aerationDuration,
      pondLoad.currentDO
    );

    const controlSequence = this.generateControlSequence(
      pondLoad.pondId,
      aerationDuration,
      optimalStartTime
    );

    const estimatedCost = this.estimateCost(aerationDuration, priceInfo.price);

    const plan: AerationPlan = {
      id: uuidv4(),
      pondId: pondLoad.pondId,
      startTime: optimalStartTime,
      endTime: optimalStartTime + aerationDuration * 60 * 1000,
      powerCost: estimatedCost,
      energyEfficiency: this.calculateEnergyEfficiency(pondLoad, priceInfo),
      waterLoad: this.calculateWaterLoad(pondLoad),
      suggestedBy: this.config.operator,
      approvedBy: null,
      status: 'pending',
      controlSequence
    };

    this.aerationPlans.set(plan.id, plan);

    this.updateBusinessNode('aeration-planning', '计划生成', `已为塘口${pondLoad.pondId}生成增氧计划`);

    if (doTrend && doTrend.isAbnormal) {
      const alert: Alert = {
        id: uuidv4(),
        type: 'warning',
        level: 'orange',
        message: `塘口${pondLoad.pondId}溶氧异常，建议立即执行增氧计划：预计${aerationDuration}分钟，费用约${estimatedCost.toFixed(2)}元`,
        source: 'AerationControlService',
        operator: this.config.operator,
        createdAt: now,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'active',
        nextAction: this.getNextAction(plan, doTrend)
      };

      this.alertCallbacks.forEach(callback => callback(alert));
    }

    return plan;
  }

  private getCurrentPriceInfo(hour: number, minute: number): { price: number; isPeak: boolean; type: 'peak' | 'valley' | 'normal' } {
    const totalMinutes = hour * 60 + minute;

    for (const peak of this.config.peakHours) {
      if (this.isTimeInRange(totalMinutes, peak.startTime, peak.endTime)) {
        return { price: peak.pricePerKWh, isPeak: true, type: 'peak' };
      }
    }

    for (const valley of this.config.valleyHours) {
      if (this.isTimeInRange(totalMinutes, valley.startTime, valley.endTime)) {
        return { price: valley.pricePerKWh, isPeak: false, type: 'valley' };
      }
    }

    for (const normal of this.config.normalHours) {
      if (this.isTimeInRange(totalMinutes, normal.startTime, normal.endTime)) {
        return { price: normal.pricePerKWh, isPeak: false, type: 'normal' };
      }
    }

    return { price: 0.8, isPeak: false, type: 'normal' };
  }

  private isTimeInRange(totalMinutes: number, startStr: string, endStr: string): boolean {
    const startMinutes = this.timeToMinutes(startStr);
    const endMinutes = this.timeToMinutes(endStr);
    
    if (endMinutes > startMinutes) {
      return totalMinutes >= startMinutes && totalMinutes < endMinutes;
    } else {
      return totalMinutes >= startMinutes || totalMinutes < endMinutes;
    }
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateAerationDuration(
    pondLoad: PondLoad,
    doTrend?: DissolvedOxygenTrend
  ): number {
    const doDeficit = Math.max(0, this.config.targetDOLow - pondLoad.currentDO);
    
    let baseMinutes = 30;
    
    if (doDeficit > 0) {
      baseMinutes += doDeficit * 30;
    }

    const tempFactor = pondLoad.temperature > 28 ? 1.3 : pondLoad.temperature > 25 ? 1.1 : 1.0;
    const biomassFactor = Math.min(2.0, pondLoad.fishBiomass / 5000 + 0.5);

    if (doTrend && doTrend.isAbnormal) {
      baseMinutes *= doTrend.status === 'critical' ? 2.0 : 1.5;
    }

    let duration = Math.round(baseMinutes * tempFactor * biomassFactor);

    return Math.max(
      this.config.minAerationTimeMinutes,
      Math.min(this.config.maxAerationTimeMinutes, duration)
    );
  }

  private findOptimalStartTime(
    currentHour: number,
    currentMinute: number,
    durationMinutes: number,
    currentDO: number
  ): number {
    const now = Date.now();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    if (currentDO < 4.0) {
      return now;
    }

    const nextValleyStart = this.findNextValleyStart(currentTimeMinutes);
    
    if (nextValleyStart !== null) {
      const minutesToValley = nextValleyStart - currentTimeMinutes;
      
      if (minutesToValley > 0 && minutesToValley < 120) {
        if (currentDO >= 5.0) {
          return now + minutesToValley * 60 * 1000;
        }
      }
    }

    return now;
  }

  private findNextValleyStart(currentMinutes: number): number | null {
    let earliestStart = Infinity;

    for (const valley of this.config.valleyHours) {
      const startMinutes = this.timeToMinutes(valley.startTime);
      
      if (startMinutes > currentMinutes) {
        earliestStart = Math.min(earliestStart, startMinutes);
      }
    }

    for (const valley of this.config.valleyHours) {
      const startMinutes = this.timeToMinutes(valley.startTime);
      if (startMinutes + 24 * 60 < earliestStart) {
        earliestStart = startMinutes + 24 * 60;
      }
    }

    return earliestStart === Infinity ? null : earliestStart;
  }

  private generateControlSequence(
    pondId: string,
    durationMinutes: number,
    startTime: number
  ): ControlSequence[] {
    const devices = Array.from(this.devices.values()).filter(d => d.pondId === pondId);
    
    const sequences: ControlSequence[] = [];

    devices.forEach((device, index) => {
      sequences.push({
        action: 'start',
        deviceId: device.id,
        delaySeconds: index * 5
      });
    });

    devices.forEach((device, index) => {
      sequences.push({
        action: 'stop',
        deviceId: device.id,
        delaySeconds: durationMinutes * 60 + index * 5
      });
    });

    return sequences;
  }

  private estimateCost(durationMinutes: number, pricePerKWh: number): number {
    const hours = durationMinutes / 60;
    const devicesCount = 2;
    return this.config.aeratorPowerKW * devicesCount * hours * pricePerKWh;
  }

  private calculateEnergyEfficiency(
    pondLoad: PondLoad,
    priceInfo: { price: number; isPeak: boolean; type: string }
  ): number {
    let efficiency = 1.0;
    
    if (priceInfo.type === 'valley') {
      efficiency *= 1.5;
    } else if (priceInfo.type === 'normal') {
      efficiency *= 1.0;
    } else {
      efficiency *= 0.6;
    }

    if (pondLoad.currentDO >= 5.0) {
      efficiency *= 1.2;
    }

    return efficiency;
  }

  private calculateWaterLoad(pondLoad: PondLoad): number {
    const tempFactor = pondLoad.temperature / 25;
    const biomassFactor = pondLoad.fishBiomass / (pondLoad.waterVolume * 1000) * 10;
    const doFactor = Math.max(0, 1 - (pondLoad.currentDO - 5) / 3);

    return (tempFactor * 0.3 + biomassFactor * 0.4 + doFactor * 0.3);
  }

  private getNextAction(plan: AerationPlan, doTrend: DissolvedOxygenTrend): string {
    if (doTrend.status === 'critical') {
      return '紧急情况！建议管理员立即审批并执行此增氧计划，同时准备人工干预预案';
    }

    if (doTrend.status === 'declining') {
      return '溶氧呈下降趋势，建议管理员尽快审批此增氧计划，预计可在谷电时段执行以节省成本';
    }

    const planTime = new Date(plan.startTime);
    return `建议在 ${planTime.toLocaleTimeString()} 执行增氧计划，预计运行 ${Math.round((plan.endTime - plan.startTime) / 60000)} 分钟，费用约 ${plan.powerCost.toFixed(2)} 元。请管理员审批确认。`;
  }

  approvePlan(planId: string, approver: string): AerationPlan | null {
    const plan = this.aerationPlans.get(planId);
    if (!plan) {
      return null;
    }

    plan.approvedBy = approver;
    plan.status = 'approved';

    this.updateBusinessNode('aeration-planning', '已审批', `计划${planId}已由${approver}审批`);
    this.updateBusinessNode('aeration-control', '执行中', '准备执行增氧控制序列');

    this.executePlan(plan);

    this.planCallbacks.forEach(callback => callback(plan));

    return plan;
  }

  private executePlan(plan: AerationPlan): void {
    plan.status = 'executing';

    setTimeout(() => {
      plan.status = 'completed';
      this.updateBusinessNode('aeration-control', '已完成', '增氧计划执行完成');
    }, plan.endTime - Date.now());
  }

  private updateBusinessNode(
    nodeId: string,
    status: string,
    nextAction: string
  ): void {
    const node = this.businessNodes.get(nodeId);
    if (node) {
      node.currentStatus = status;
      node.nextAction = nextAction;
      node.lastUpdateTime = Date.now();
    }
  }

  getAerationPlan(planId: string): AerationPlan | undefined {
    return this.aerationPlans.get(planId);
  }

  getAllPlans(): AerationPlan[] {
    return Array.from(this.aerationPlans.values());
  }

  getBusinessNodes(): BusinessNode[] {
    return Array.from(this.businessNodes.values());
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  onPlanApproved(callback: (plan: AerationPlan) => void): void {
    this.planCallbacks.push(callback);
  }

  updateConfig(config: Partial<AerationControlConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AerationControlConfig {
    return { ...this.config };
  }
}
