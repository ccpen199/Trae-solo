import { useAppStore } from '../store/appStore';
import { 
  Alert, 
  SensorData, 
  DissolvedOxygenTrend, 
  AerationPlan, 
  FeedingPlan,
  PowerStatus
} from '../types';

export interface WebSocketMessage {
  type: string;
  data?: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private url: string;
  private isManualClose = false;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.url = `${protocol}//${host}/ws`;
    }
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    console.log(`尝试连接 WebSocket: ${this.url}`);
    
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✓ WebSocket 连接已建立');
        useAppStore.getState().setIsConnected(true);
        this.reconnectAttempts = 0;
        setTimeout(() => {
          this.send({ type: 'GET_STATUS' });
        }, 100);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket 连接已关闭, code: ${event.code}, reason: ${event.reason}`);
        useAppStore.getState().setIsConnected(false);
        
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('✗ WebSocket 错误:', error);
      };
    } catch (error) {
      console.error('✗ 创建 WebSocket 连接失败:', error);
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const store = useAppStore.getState();

    switch (message.type) {
      case 'CONNECTION_ESTABLISHED':
        console.log('连接已建立:', message.data);
        break;

      case 'STATUS_UPDATE':
        if (message.data && typeof message.data === 'object') {
          const data = message.data as {
            ponds: unknown[];
            devices: unknown[];
            businessNodes: unknown[];
            powerStatus: PowerStatus;
            alerts: Alert[];
            timestamp: number;
          };
          store.setPonds(data.ponds || []);
          store.setDevices(data.devices || []);
          store.setBusinessNodes(data.businessNodes || []);
          store.setPowerStatus(data.powerStatus);
          store.setAlerts(data.alerts || []);
        }
        break;

      case 'NEW_ALERT':
        if (message.data) {
          const alert = message.data as Alert;
          store.addAlert(alert);
          this.playAlertSound(alert.level);
          this.showAlertNotification(alert);
        }
        break;

      case 'ALERT_ACKNOWLEDGED':
        if (message.data) {
          const alert = message.data as Alert;
          store.acknowledgeAlert(alert.id, alert.acknowledgedBy || '');
        }
        break;

      case 'ALERT_RESOLVED':
        if (message.data) {
          const alert = message.data as Alert;
          store.resolveAlert(alert.id);
        }
        break;

      case 'SENSOR_DATA_UPDATED':
        if (message.data) {
          const sensorData = message.data as SensorData;
          store.addSensorData(sensorData);
        }
        break;

      case 'DO_TREND_UPDATED':
        if (message.data) {
          const trend = message.data as DissolvedOxygenTrend;
          const currentTrends = store.doTrends.filter(t => t.pondId !== trend.pondId);
          store.setDOTrends([...currentTrends, trend]);
        }
        break;

      case 'AERATION_PLAN_GENERATED':
        if (message.data) {
          const plan = message.data as AerationPlan;
          store.setAerationPlans([...store.aerationPlans, plan]);
        }
        break;

      case 'AERATION_PLAN_APPROVED':
        if (message.data) {
          const plan = message.data as AerationPlan;
          store.updateAerationPlan(plan);
        }
        break;

      case 'FEEDING_PLAN_GENERATED':
        if (message.data) {
          const plan = message.data as FeedingPlan;
          store.setFeedingPlans([...store.feedingPlans, plan]);
        }
        break;

      case 'FEEDING_PLAN_APPROVED':
        if (message.data) {
          const plan = message.data as FeedingPlan;
          store.setFeedingPlans(store.feedingPlans.map(p => 
            p.id === plan.id ? plan : p
          ));
        }
        break;

      case 'EMERGENCY_MODE_CHANGED':
        if (message.data && typeof message.data === 'object') {
          const { isEmergency } = message.data as { isEmergency: boolean };
          if (isEmergency) {
            this.playEmergencySound();
          }
        }
        break;

      case 'POWER_STATUS_UPDATED':
        if (message.data) {
          store.setPowerStatus(message.data as PowerStatus);
        }
        break;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  simulateSensorData(data: {
    pondId: string;
    dissolvedOxygen: number;
    temperature: number;
    ammoniaNitrogen: number;
    nitrite: number;
  }): void {
    this.send({
      type: 'SIMULATE_SENSOR_DATA',
      data
    });
  }

  simulatePowerLoss(): void {
    this.send({ type: 'SIMULATE_POWER_LOSS' });
  }

  simulatePowerRestore(): void {
    this.send({ type: 'SIMULATE_POWER_RESTORE' });
  }

  acknowledgeAlert(alertId: string, operator: string): void {
    this.send({
      type: 'ACKNOWLEDGE_ALERT',
      data: { alertId, operator }
    });
  }

  resolveAlert(alertId: string): void {
    this.send({
      type: 'RESOLVE_ALERT',
      data: { alertId }
    });
  }

  approveAerationPlan(planId: string, approver: string): void {
    this.send({
      type: 'APPROVE_AERATION_PLAN',
      data: { planId, approver }
    });
  }

  approveFeedingPlan(planId: string, approver: string): void {
    this.send({
      type: 'APPROVE_FEEDING_PLAN',
      data: { planId, approver }
    });
  }

  generateAerationPlan(data: {
    pondId: string;
    currentDO: number;
    temperature: number;
    fishBiomass: number;
    waterVolume: number;
  }): void {
    this.send({
      type: 'GENERATE_AERATION_PLAN',
      data
    });
  }

  generateFeedingPlan(data: {
    pondId: string;
    fishWeight: number;
    waterTemperature: number;
    waterQualityScore: number;
    acousticData?: {
      feedingIntensity: number;
      frequencyBand: number;
      analysisTime: number;
      interpretation: string;
    };
  }): void {
    this.send({
      type: 'GENERATE_FEEDING_PLAN',
      data
    });
  }

  private playAlertSound(level: string): void {
    console.log(`播放预警音效: ${level}`);
  }

  private playEmergencySound(): void {
    console.log('播放紧急警报音效');
  }

  private showAlertNotification(alert: Alert): void {
    console.log('显示预警通知:', alert);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();

export default webSocketService;
