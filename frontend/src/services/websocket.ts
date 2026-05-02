import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { message } from 'antd';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8248';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const token = useAuthStore.getState().token;

      if (this.socket && this.isConnected) {
        resolve(true);
        return;
      }

      try {
        this.socket = io(WS_URL, {
          transports: ['websocket', 'polling'],
          auth: { token },
          query: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket 连接成功');
          resolve(true);
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('WebSocket 连接断开');
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket 连接错误:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('WebSocket 重连次数过多，停止重连');
            this.socket?.disconnect();
          }
          resolve(false);
        });

        this.socket.on('my-turn', (data) => {
          message.info({
            content: `请您就诊！号：${data.queueNumber}`,
            duration: 0,
          });
          this.emit('my-turn', data);
        });

        this.socket.on('queue-update', (data) => {
          this.emit('queue-update', data);
        });

        this.socket.on('queue-called', (data) => {
          this.emit('queue-called', data);
        });

        this.socket.on('registration-created', (data) => {
          this.emit('registration-created', data);
        });

        this.socket.on('check-in-success', (data) => {
          this.emit('check-in-success', data);
        });

        this.socket.on('appointment-updated', (data) => {
          this.emit('appointment-updated', data);
        });

        this.socket.on('refund-completed', (data) => {
          message.success('退款已完成');
          this.emit('refund-completed', data);
        });

        this.socket.on('notification', (data) => {
          this.emit('notification', data);
        });

        this.socket.on('system-message', (data) => {
          if (data.type === 'success') {
            message.success(data.message);
          } else if (data.type === 'error') {
            message.error(data.message);
          } else {
            message.info(data.message);
          }
          this.emit('system-message', data);
        });
      } catch (error) {
        console.error('WebSocket 初始化失败:', error);
        resolve(false);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribeQueue(doctorId?: string, departmentId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-queue', { doctorId, departmentId });
    }
  }

  unsubscribeQueue(doctorId?: string, departmentId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-queue', { doctorId, departmentId });
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件处理错误 [${event}]:`, error);
      }
    });
  }

  ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }
}

export const wsService = new WebSocketService();
