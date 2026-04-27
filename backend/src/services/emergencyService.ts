import { v4 as uuidv4 } from 'uuid';
import { PowerStatus, PowerSwitchPlan, Alert, BusinessNode, Device } from '../types';
import { PowerSwitchEngine, PowerSwitchConfig, PowerMonitorData, WaterGateState } from '../engines/powerSwitchEngine';

export interface EmergencyServiceConfig {
  phoneAlertEnabled: boolean;
  smsAlertEnabled: boolean;
  emergencyContacts: string[];
  operator: string;
}

export const DEFAULT_EMERGENCY_CONFIG: EmergencyServiceConfig = {
  phoneAlertEnabled: true,
  smsAlertEnabled: true,
  emergencyContacts: ['管理员-张三', '运维员-李四'],
  operator: 'Emergency-Service'
};

export class EmergencyService {
  private config: EmergencyServiceConfig;
  private powerEngine: PowerSwitchEngine;
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private businessNodes: Map<string, BusinessNode> = new Map();
  private devices: Map<string, Device> = new Map();
  private isEmergencyMode: boolean = false;

  constructor(
    config?: Partial<EmergencyServiceConfig>,
    powerConfig?: Partial<PowerSwitchConfig>
  ) {
    this.config = { ...DEFAULT_EMERGENCY_CONFIG, ...config };
    this.powerEngine = new PowerSwitchEngine(powerConfig);
    this.initializeBusinessNodes();
    this.initializeDevices();

    this.powerEngine.onAlert((alert) => {
      this.alertCallbacks.forEach(callback => callback(alert));
    });

    this.powerEngine.onGateAction((action) => {
      this.handleGateAction(action);
    });

    this.powerEngine.onPowerSwitch((plan) => {
      this.handlePowerSwitch(plan);
    });
  }

  private initializeBusinessNodes(): void {
    const now = Date.now();

    this.businessNodes.set('power-monitoring', {
      id: 'power-monitoring',
      name: '电源状态监控',
      description: '实时监控主电源和备用电源状态',
      source: '电源监测传感器',
      responsiblePerson: '电力运维员',
      currentStatus: '运行中',
      nextAction: '持续监控电源状态',
      lastUpdateTime: now,
      dependencies: [],
      affectedNodes: ['emergency-handling', 'gate-control']
    });

    this.businessNodes.set('emergency-handling', {
      id: 'emergency-handling',
      name: '应急处理',
      description: '处理电源故障等紧急情况',
      source: '电源状态异常',
      responsiblePerson: '应急响应员',
      currentStatus: '待命',
      nextAction: '等待应急事件触发',
      lastUpdateTime: now,
      dependencies: ['power-monitoring'],
      affectedNodes: ['phone-alert', 'gate-control']
    });

    this.businessNodes.set('gate-control', {
      id: 'gate-control',
      name: '应急闸机控制',
      description: '控制应急供水闸机的开关',
      source: '应急处理指令',
      responsiblePerson: '设备运维员',
      currentStatus: '待命',
      nextAction: '等待闸机控制指令',
      lastUpdateTime: now,
      dependencies: ['emergency-handling'],
      affectedNodes: ['pond-oxygen-monitoring']
    });

    this.businessNodes.set('phone-alert', {
      id: 'phone-alert',
      name: '手机报警通知',
      description: '通过电话和短信通知紧急情况',
      source: '应急事件',
      responsiblePerson: '系统管理员',
      currentStatus: '待命',
      nextAction: '等待报警触发',
      lastUpdateTime: now,
      dependencies: ['emergency-handling'],
      affectedNodes: []
    });
  }

  private initializeDevices(): void {
    const now = Date.now();

    const gate1: Device = {
      id: 'gate-001',
      name: '应急供水闸机1号',
      type: 'gate',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    const gate2: Device = {
      id: 'gate-002',
      name: '应急供水闸机2号',
      type: 'gate',
      pondId: 'pond-002',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    this.devices.set(gate1.id, gate1);
    this.devices.set(gate2.id, gate2);
  }

  processPowerData(data: PowerMonitorData): PowerStatus {
    const previousPowered = this.powerEngine.getPowerStatus().isPowered;
    const status = this.powerEngine.processPowerData(data);

    if (!status.isPowered && previousPowered) {
      this.isEmergencyMode = true;
      this.triggerEmergencyResponse();
    } else if (status.isPowered && !previousPowered) {
      this.isEmergencyMode = false;
      this.handlePowerRecovery();
    }

    return status;
  }

  private triggerEmergencyResponse(): void {
    this.updateBusinessNode('power-monitoring', '异常告警', '检测到主电源断电');
    this.updateBusinessNode('emergency-handling', '应急处理中', '启动应急响应流程');
    this.updateBusinessNode('gate-control', '执行中', '准备开启应急供水闸机');
    this.updateBusinessNode('phone-alert', '发送中', '正在发送电话和短信报警');

    if (this.config.phoneAlertEnabled) {
      this.sendPhoneAlert();
    }
    if (this.config.smsAlertEnabled) {
      this.sendSmsAlert();
    }

    const emergencyAlert: Alert = {
      id: uuidv4(),
      type: 'critical',
      level: 'red',
      message: `紧急！主电源断电！已向以下人员发送报警：${this.config.emergencyContacts.join('、')}`,
      source: 'EmergencyService',
      operator: this.config.operator,
      createdAt: Date.now(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: this.getNextAction('emergency')
    };

    this.alertCallbacks.forEach(callback => callback(emergencyAlert));
  }

  private handlePowerRecovery(): void {
    this.updateBusinessNode('power-monitoring', '运行中', '主电源已恢复');
    this.updateBusinessNode('emergency-handling', '恢复中', '处理电源恢复流程');
    this.updateBusinessNode('gate-control', '执行中', '准备关闭应急供水闸机');
    this.updateBusinessNode('phone-alert', '待命', '电源已恢复，报警已解除');

    const recoveryAlert: Alert = {
      id: uuidv4(),
      type: 'info',
      level: 'blue',
      message: '主电源已恢复正常，备用电源和应急供水系统正在关闭',
      source: 'EmergencyService',
      operator: this.config.operator,
      createdAt: Date.now(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'active',
      nextAction: this.getNextAction('recovery')
    };

    this.alertCallbacks.forEach(callback => callback(recoveryAlert));
  }

  private handleGateAction(action: 'open' | 'close'): void {
    const gateDevices = Array.from(this.devices.values()).filter(d => d.type === 'gate');
    
    gateDevices.forEach(device => {
      device.lastCheckTime = Date.now();
      device.nextAction = action === 'open' ? '闸机已开启，持续供水' : '闸机已关闭，恢复正常状态';
    });

    if (action === 'open') {
      this.updateBusinessNode('gate-control', '运行中', '应急供水闸机已开启，正在提供应急水源');
    } else {
      this.updateBusinessNode('gate-control', '待命', '应急供水闸机已关闭');
    }
  }

  private handlePowerSwitch(plan: PowerSwitchPlan): void {
    const status = plan.triggerType === 'emergency' ? '应急切换' : '计划切换';
    this.updateBusinessNode('power-monitoring', status, `电源从${plan.sourcePower === 'main' ? '主电源' : '备用电源'}切换到${plan.targetPower === 'main' ? '主电源' : '备用电源'}`);
  }

  private sendPhoneAlert(): void {
    console.log(`[Phone Alert] 正在向 ${this.config.emergencyContacts.join(', ')} 发送电话报警...`);
  }

  private sendSmsAlert(): void {
    console.log(`[SMS Alert] 正在向 ${this.config.emergencyContacts.join(', ')} 发送短信报警...`);
  }

  private getNextAction(type: 'emergency' | 'recovery'): string {
    if (type === 'emergency') {
      return `紧急情况处理中：1. 备用电源已启动；2. 应急供水闸机已开启；3. 已通知 ${this.config.emergencyContacts.join('、')}。请管理员尽快前往现场确认设备运行状态，检查溶氧水平是否维持在安全范围。`;
    }
    return '电源恢复处理中：1. 主电源已恢复；2. 正在切换回主电源；3. 准备关闭应急供水闸机。请管理员确认所有设备运行正常，检查水质指标是否稳定。';
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

  simulatePowerLoss(): void {
    this.powerEngine.simulatePowerLoss();
  }

  simulatePowerRestore(): void {
    this.powerEngine.simulatePowerRestore();
  }

  getPowerStatus(): PowerStatus {
    return this.powerEngine.getPowerStatus();
  }

  getWaterGateState(): WaterGateState {
    return this.powerEngine.getWaterGateState();
  }

  getSwitchPlans(): PowerSwitchPlan[] {
    return this.powerEngine.getSwitchPlans();
  }

  getBusinessNodes(): BusinessNode[] {
    return Array.from(this.businessNodes.values());
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  updateConfig(config: Partial<EmergencyServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EmergencyServiceConfig {
    return { ...this.config };
  }

  acknowledgeEmergency(acknowledger: string): void {
    this.updateBusinessNode('emergency-handling', '已确认', `应急情况已由 ${acknowledger} 确认处理`);
  }
}
