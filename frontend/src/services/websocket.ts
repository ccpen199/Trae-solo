import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import {
  SensorReading,
  Alarm,
  ControlCommand,
  ControlDevice,
  AlarmAction,
} from '../types';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

type Callback<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private messageHandlers: Map<string, Set<Callback<any>>> = new Map();

  connect(userId: string = 'anonymous', userName: string = 'Anonymous'): void {
    if (this.connected && this.socket) {
      return;
    }

    this.socket = io(`${WS_URL}/farm`, {
      query: {
        userId,
        userName,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('connected', (data) => {
      console.log('Server acknowledged connection:', data);
    });

    this.socket.on('sensor_reading', (data) => {
      this.handleMessage('sensor_reading', data);
    });

    this.socket.on('alarm_created', (data) => {
      message.warning(`新告警: ${data.alarm?.title || '未知告警'}`);
      this.handleMessage('alarm_created', data);
    });

    this.socket.on('alarm_updated', (data) => {
      this.handleMessage('alarm_updated', data);
    });

    this.socket.on('alarm_acknowledged', (data) => {
      message.info(`告警已确认: ${data.alarm?.title || '未知告警'}`);
      this.handleMessage('alarm_acknowledged', data);
    });

    this.socket.on('control_command_issued', (data) => {
      message.info(`控制指令已下发: ${data.command?.commandType || '未知指令'}`);
      this.handleMessage('control_command_issued', data);
    });

    this.socket.on('control_status_updated', (data) => {
      this.handleMessage('control_status_updated', data);
    });

    this.socket.on('device_status', (data) => {
      this.handleMessage('device_status', data);
    });

    this.socket.on('error', (data) => {
      message.error(`WebSocket错误: ${data.message || '未知错误'}`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(zones: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe', { zones });
    }
  }

  unsubscribe(zones: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe', { zones });
    }
  }

  getLatestReadings(sensorId: string, limit: number = 20): void {
    if (this.socket && this.connected) {
      this.socket.emit('get_latest_readings', { sensorId, limit });
    }
  }

  getOpenAlarms(): void {
    if (this.socket && this.connected) {
      this.socket.emit('get_open_alarms', {});
    }
  }

  acknowledgeAlarm(alarmId: string, operatorName: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('acknowledge_alarm', { alarmId, operatorName });
    }
  }

  confirmAction(actionId: string, operatorName: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('confirm_action', { actionId, operatorName });
    }
  }

  executePidControl(data: {
    deviceId: string;
    targetValue?: number;
    cropId?: string;
    growthDay?: number;
    operatorName?: string;
  }): void {
    if (this.socket && this.connected) {
      this.socket.emit('execute_pid_control', data);
    }
  }

  executeManualControl(data: {
    deviceId: string;
    targetValue: number;
    operatorName: string;
    reason?: string;
    durationSeconds?: number;
  }): void {
    if (this.socket && this.connected) {
      this.socket.emit('manual_control', data);
    }
  }

  on(event: string, callback: Callback<any>): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(callback);

    return () => {
      this.messageHandlers.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: Callback<any>): void {
    this.messageHandlers.get(event)?.delete(callback);
  }

  private handleMessage(event: string, data: any): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error handling WebSocket message for event ${event}:`, error);
        }
      });
    }
  }
}

export const webSocketService = new WebSocketService();

export default webSocketService;
