import { v4 as uuidv4 } from 'uuid';
import { SensorData, Alert, BusinessNode, Pond, Device } from '../types';
import { DissolvedOxygenAnalysisEngine, DOEngineConfig } from '../engines/dissolvedOxygenEngine';

export interface SensorDataServiceConfig {
  maxDataPoints: number;
  dataRetentionHours: number;
  operator: string;
}

export const DEFAULT_SENSOR_CONFIG: SensorDataServiceConfig = {
  maxDataPoints: 1000,
  dataRetentionHours: 24,
  operator: 'Sensor-Data-Service'
};

export class SensorDataService {
  private config: SensorDataServiceConfig;
  private dataStore: Map<string, SensorData[]> = new Map();
  private doEngine: DissolvedOxygenAnalysisEngine;
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private dataCallbacks: ((data: SensorData) => void)[] = [];
  private businessNodes: Map<string, BusinessNode> = new Map();
  private ponds: Map<string, Pond> = new Map();
  private devices: Map<string, Device> = new Map();

  constructor(
    config?: Partial<SensorDataServiceConfig>,
    doConfig?: Partial<DOEngineConfig>
  ) {
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...config };
    this.doEngine = new DissolvedOxygenAnalysisEngine(doConfig);
    this.initializeBusinessNodes();
    this.initializeDefaultData();

    this.doEngine.onAlert((alert) => {
      this.alertCallbacks.forEach(callback => callback(alert));
    });
  }

  private initializeBusinessNodes(): void {
    const now = Date.now();
    
    this.businessNodes.set('sensor-data-collection', {
      id: 'sensor-data-collection',
      name: '传感器数据采集',
      description: '实时采集氨氮、亚盐、溶氧、温度等水质指标',
      source: '传感器组',
      responsiblePerson: '自动化运维员',
      currentStatus: '运行中',
      nextAction: '继续轮询传感器数据',
      lastUpdateTime: now,
      dependencies: [],
      affectedNodes: ['water-quality-analysis', 'do-trend-analysis']
    });

    this.businessNodes.set('water-quality-analysis', {
      id: 'water-quality-analysis',
      name: '水质综合分析',
      description: '分析氨氮、亚盐等有毒物质指标',
      source: '传感器数据',
      responsiblePerson: '水质分析师',
      currentStatus: '等待数据',
      nextAction: '等待新的传感器数据进行分析',
      lastUpdateTime: now,
      dependencies: ['sensor-data-collection'],
      affectedNodes: ['water-quality-alert', 'feeding-decision']
    });

    this.businessNodes.set('do-trend-analysis', {
      id: 'do-trend-analysis',
      name: '溶氧趋势分析',
      description: '分析溶氧下降速率，判断异常情况',
      source: '溶氧传感器数据',
      responsiblePerson: '系统工程师',
      currentStatus: '等待数据',
      nextAction: '等待新的溶氧数据进行趋势分析',
      lastUpdateTime: now,
      dependencies: ['sensor-data-collection'],
      affectedNodes: ['do-alert', 'aeration-control']
    });
  }

  private initializeDefaultData(): void {
    const now = Date.now();
    
    const pond1: Pond = {
      id: 'pond-001',
      name: '1号养殖塘',
      area: 5000,
      depth: 2.5,
      currentStatus: 'normal',
      operator: this.config.operator,
      nextAction: '常规监测中'
    };

    const pond2: Pond = {
      id: 'pond-002',
      name: '2号养殖塘',
      area: 4500,
      depth: 2.0,
      currentStatus: 'normal',
      operator: this.config.operator,
      nextAction: '常规监测中'
    };

    this.ponds.set(pond1.id, pond1);
    this.ponds.set(pond2.id, pond2);

    const sensor1: Device = {
      id: 'sensor-do-001',
      name: '1号塘溶氧传感器',
      type: 'sensor',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '正常运行中'
    };

    const sensor2: Device = {
      id: 'sensor-water-001',
      name: '1号塘水质传感器',
      type: 'sensor',
      pondId: 'pond-001',
      status: 'online',
      lastCheckTime: now,
      operator: this.config.operator,
      nextAction: '正常运行中'
    };

    this.devices.set(sensor1.id, sensor1);
    this.devices.set(sensor2.id, sensor2);
  }

  processSensorData(rawData: Omit<SensorData, 'id' | 'operator' | 'source'>): SensorData {
    const now = Date.now();
    
    const sensorData: SensorData = {
      id: uuidv4(),
      ...rawData,
      source: 'SensorDataService',
      operator: this.config.operator
    };

    const pondHistory = this.dataStore.get(sensorData.pondId) || [];
    pondHistory.push(sensorData);
    
    const cutoffTime = now - this.config.dataRetentionHours * 60 * 60 * 1000;
    const filteredHistory = pondHistory
      .filter(d => d.timestamp > cutoffTime)
      .slice(-this.config.maxDataPoints);
    
    this.dataStore.set(sensorData.pondId, filteredHistory);

    this.updateBusinessNode('sensor-data-collection', '运行中', '数据已接收，触发分析流程');
    this.updateBusinessNode('water-quality-analysis', '分析中', '分析当前水质指标');
    this.updateBusinessNode('do-trend-analysis', '分析中', '分析溶氧变化趋势');

    const doTrend = this.doEngine.processSensorData(sensorData);

    if (doTrend.isAbnormal) {
      this.updatePondStatus(sensorData.pondId, 'warning');
      this.updateBusinessNode('do-trend-analysis', '异常告警', `检测到溶氧${doTrend.status === 'critical' ? '严重' : ''}下降`);
    } else {
      this.updatePondStatus(sensorData.pondId, 'normal');
    }

    this.checkWaterQuality(sensorData);

    this.dataCallbacks.forEach(callback => callback(sensorData));

    return sensorData;
  }

  private checkWaterQuality(data: SensorData): void {
    const ammoniaThreshold = 0.5;
    const nitriteThreshold = 0.15;

    if (data.ammoniaNitrogen > ammoniaThreshold || data.nitrite > nitriteThreshold) {
      const alert: Alert = {
        id: uuidv4(),
        type: 'warning',
        level: 'orange',
        message: `塘口${data.pondId}水质异常：氨氮${data.ammoniaNitrogen.toFixed(2)}mg/L（阈值${ammoniaThreshold}），亚盐${data.nitrite.toFixed(2)}mg/L（阈值${nitriteThreshold}）`,
        source: 'SensorDataService',
        operator: this.config.operator,
        createdAt: Date.now(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'active',
        nextAction: '建议减少投喂量，增加换水量，监测水质变化'
      };

      this.alertCallbacks.forEach(callback => callback(alert));
      this.updateBusinessNode('water-quality-analysis', '异常告警', '检测到水质指标超标');
    }
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

  private updatePondStatus(pondId: string, status: Pond['currentStatus']): void {
    const pond = this.ponds.get(pondId);
    if (pond) {
      pond.currentStatus = status;
      pond.nextAction = status === 'normal' ? '常规监测中' : '需要关注异常情况';
    }
  }

  getSensorData(pondId: string, limit?: number): SensorData[] {
    const data = this.dataStore.get(pondId) || [];
    return limit ? data.slice(-limit) : [...data];
  }

  getAllSensorData(): SensorData[] {
    const allData: SensorData[] = [];
    this.dataStore.forEach(data => allData.push(...data));
    return allData.sort((a, b) => b.timestamp - a.timestamp);
  }

  getLatestData(pondId: string): SensorData | undefined {
    const data = this.dataStore.get(pondId);
    return data ? data[data.length - 1] : undefined;
  }

  getBusinessNodes(): BusinessNode[] {
    return Array.from(this.businessNodes.values());
  }

  getBusinessNode(nodeId: string): BusinessNode | undefined {
    return this.businessNodes.get(nodeId);
  }

  getPonds(): Pond[] {
    return Array.from(this.ponds.values());
  }

  getPond(pondId: string): Pond | undefined {
    return this.ponds.get(pondId);
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getDOEngine(): DissolvedOxygenAnalysisEngine {
    return this.doEngine;
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  onData(callback: (data: SensorData) => void): void {
    this.dataCallbacks.push(callback);
  }

  updateConfig(config: Partial<SensorDataServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SensorDataServiceConfig {
    return { ...this.config };
  }
}
