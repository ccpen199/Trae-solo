import { v4 as uuidv4 } from 'uuid';
import { FeedingPlan, AcousticData, Alert, BusinessNode, Device, SensorData } from '../types';
import { 
  FeedingDecisionEngine, 
  FeedingConfig, 
  PondEnvironment, 
  AcousticSensorData,
  FeedingHistoryEntry
} from '../engines/feedingDecisionEngine';

export interface FeedingControlServiceConfig {
  operator: string;
}

export const DEFAULT_FEEDING_CONTROL_CONFIG: FeedingControlServiceConfig = {
  operator: 'Feeding-Control-Service'
};

export class FeedingControlService {
  private config: FeedingControlServiceConfig;
  private feedingEngine: FeedingDecisionEngine;
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private planCallbacks: ((plan: FeedingPlan) => void)[] = [];
  private businessNodes: Map<string, BusinessNode> = new Map();
  private devices: Map<string, Device> = new Map();
  private sensorDataCache: Map<string, SensorData> = new Map();

  constructor(
    config?: Partial<FeedingControlServiceConfig>,
    feedingConfig?: Partial<FeedingConfig>
  ) {
    this.config = { ...DEFAULT_FEEDING_CONTROL_CONFIG, ...config };
    this.feedingEngine = new FeedingDecisionEngine(feedingConfig);
    this.initializeBusinessNodes();
    this.initializeDevices();

    this.feedingEngine.onAlert((alert) => {
      this.alertCallbacks.forEach(callback => callback(alert));
    });

    this.feedingEngine.onFeedingPlan((plan) => {
      this.planCallbacks.forEach(callback => callback(plan));
    });
  }

  private initializeBusinessNodes(): void {
    const now = Date.now();

    this.businessNodes.set('acoustic-monitoring', {
      id: 'acoustic-monitoring',
      name: '声学摄食监测',
      description: '通过声学传感器监测鱼类摄食行为',
      source: '水下水听器',
      responsiblePerson: '水产工程师',
      currentStatus: '运行中',
      nextAction: '持续监测鱼类摄食声音',
      lastUpdateTime: now,
      dependencies: [],
      affectedNodes: ['feeding-decision', 'water-quality-analysis']
    });

    this.businessNodes.set('feeding-decision', {
      id: 'feeding-decision',
      name: '投喂决策',
      description: '根据环境温度、摄食频率动态调整投饵参数',
      source: '声学数据、温度数据、水质数据',
      responsiblePerson: '养殖技术员',
      currentStatus: '等待数据',
      nextAction: '等待声学和环境数据生成投喂计划',
      lastUpdateTime: now,
      dependencies: ['acoustic-monitoring', 'water-quality-analysis'],
      affectedNodes: ['feeder-control', 'water-quality-monitoring']
    });

    this.businessNodes.set('feeder-control', {
      id: 'feeder-control',
      name: '投饵机控制',
      description: '控制投饵机执行投喂操作',
      source: '投喂计划',
      responsiblePerson: '设备运维员',
      currentStatus: '待命',
      nextAction: '等待投喂计划审批后执行',
      lastUpdateTime: now,
      dependencies: ['feeding-decision'],
      affectedNodes: ['feeding-record']
    });

    this.businessNodes.set('water-quality-impact', {
      id: 'water-quality-impact',
      name: '水质影响评估',
      description: '评估投喂对水质的影响，减少饲料沉积导致的二次污染',
      source: '投喂记录、水质数据',
      responsiblePerson: '水质分析师',
      currentStatus: '等待数据',
      nextAction: '等待投喂完成后评估水质影响',
      lastUpdateTime: now,
      dependencies: ['feeder-control', 'water-quality-analysis'],
      affectedNodes: ['feeding-decision']
    });
  }

  private initializeDevices(): void {
    const now = Date.now();

    const feeder1: Device = {
      id: 'feeder-001',
      name: '1号投饵机',
      type: 'feeder',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    const feeder2: Device = {
      id: 'feeder-002',
      name: '2号投饵机',
      type: 'feeder',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '待命'
    };

    this.devices.set(feeder1.id, feeder1);
    this.devices.set(feeder2.id, feeder2);
  }

  processAcousticData(data: AcousticSensorData): AcousticData {
    const result = this.feedingEngine.analyzeAcousticData(data);

    this.updateBusinessNode('acoustic-monitoring', '分析中', `正在分析塘口${data.pondId}的摄食声学数据`);

    if (result.feedingIntensity < 0.3) {
      this.updateBusinessNode('acoustic-monitoring', '异常告警', `摄食活动异常低：${result.interpretation}`);
    } else {
      this.updateBusinessNode('acoustic-monitoring', '正常', result.interpretation);
    }

    return result;
  }

  generateFeedingPlan(
    env: PondEnvironment,
    acousticData?: AcousticData
  ): FeedingPlan {
    const plan = this.feedingEngine.calculateOptimalFeeding(env, acousticData);

    this.updateBusinessNode('feeding-decision', '计划生成', `已为塘口${env.pondId}生成投喂计划`);
    this.updateBusinessNode('feeder-control', '待审批', '等待投喂计划审批');

    return plan;
  }

  updateSensorData(sensorData: SensorData): void {
    this.sensorDataCache.set(sensorData.pondId, sensorData);
  }

  calculateWaterQualityScore(sensorData: SensorData): number {
    const ammoniaNitrogenScore = this.calculateScore(sensorData.ammoniaNitrogen, 0, 0.5, 1.0);
    const nitriteScore = this.calculateScore(sensorData.nitrite, 0, 0.1, 0.2);
    const dissolvedOxygenScore = this.calculateDODScore(sensorData.dissolvedOxygen);

    const weights = this.feedingEngine.getConfig().waterQualityWeight;
    const totalScore = 
      ammoniaNitrogenScore * weights.ammoniaNitrogen +
      nitriteScore * weights.nitrite +
      dissolvedOxygenScore * weights.dissolvedOxygen;

    return Math.round(totalScore * 100);
  }

  private calculateScore(value: number, ideal: number, warning: number, critical: number): number {
    if (value <= ideal) return 1.0;
    if (value <= warning) return 1.0 - (value - ideal) / (warning - ideal) * 0.3;
    if (value <= critical) return 0.7 - (value - warning) / (critical - warning) * 0.4;
    return 0.3;
  }

  private calculateDODScore(value: number): number {
    if (value >= 6.0) return 1.0;
    if (value >= 5.0) return 0.9;
    if (value >= 4.0) return 0.7;
    if (value >= 3.0) return 0.5;
    return 0.3;
  }

  approveFeedingPlan(planId: string, approver: string): FeedingPlan | null {
    const plan = this.feedingEngine.getFeedingPlan(planId);
    if (!plan) {
      return null;
    }

    this.feedingEngine.approveFeedingPlan(planId, approver);

    this.updateBusinessNode('feeding-decision', '已审批', `计划${planId}已由${approver}审批`);
    this.updateBusinessNode('feeder-control', '执行中', '准备执行投喂操作');

    this.executeFeeding(plan);

    return plan;
  }

  private executeFeeding(plan: FeedingPlan): void {
    const now = Date.now();

    this.feedingEngine.recordFeedingComplete(plan.id, plan.targetAmount);

    this.updateBusinessNode('feeder-control', '已完成', `投喂完成：${plan.targetAmount.toFixed(2)}kg`);
    this.updateBusinessNode('water-quality-impact', '评估中', '评估本次投喂对水质的影响');

    const sensorData = this.sensorDataCache.get(plan.pondId);
    if (sensorData) {
      const impactScore = this.assessWaterQualityImpact(plan, sensorData);
      this.updateBusinessNode('water-quality-impact', '已完成', `水质影响评估得分：${impactScore.toFixed(1)}`);

      if (impactScore < 60) {
        const impactAlert: Alert = {
          id: uuidv4(),
          type: 'warning',
          level: 'orange',
          message: `塘口${plan.pondId}投喂后水质风险较高，建议减少下次投喂量`,
          source: 'FeedingControlService',
          operator: this.config.operator,
          createdAt: now,
          acknowledgedAt: null,
          acknowledgedBy: null,
          status: 'active',
          nextAction: this.getImpactNextAction(impactScore, plan)
        };
        this.alertCallbacks.forEach(callback => callback(impactAlert));
      }
    }
  }

  private assessWaterQualityImpact(plan: FeedingPlan, sensorData: SensorData): number {
    const feedingRatio = plan.targetAmount / 100;
    const waterQualityScore = this.calculateWaterQualityScore(sensorData);
    
    const impactScore = Math.max(0, 100 - (feedingRatio * 30 + (100 - waterQualityScore) * 0.5));
    
    return impactScore;
  }

  private getImpactNextAction(score: number, plan: FeedingPlan): string {
    if (score < 40) {
      return `水质风险很高！建议：1. 减少下次投喂量${Math.round((1 - score / 100) * 50)}%；2. 增加换水量；3. 监测氨氮、亚盐指标；4. 考虑启动增氧设备`;
    } else if (score < 60) {
      return `水质风险中等。建议：1. 减少下次投喂量${Math.round((1 - score / 100) * 30)}%；2. 密切监测水质变化；3. 可考虑在下次投喂前适当增氧`;
    }
    return `水质影响评估良好。建议继续按计划投喂，持续监测摄食行为和水质指标`;
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

  getFeedingPlan(planId: string): FeedingPlan | undefined {
    return this.feedingEngine.getFeedingPlan(planId);
  }

  getAllPlans(): FeedingPlan[] {
    return this.feedingEngine.getAllPlans();
  }

  getFeedingHistory(pondId: string): FeedingHistoryEntry[] {
    return this.feedingEngine.getFeedingHistory(pondId);
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

  onFeedingPlan(callback: (plan: FeedingPlan) => void): void {
    this.planCallbacks.push(callback);
  }

  updateConfig(config: Partial<FeedingControlServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FeedingControlServiceConfig {
    return { ...this.config };
  }
}
