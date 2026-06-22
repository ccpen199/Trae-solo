import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import type { TaskPool, Order, LocationReportRequest, TimeoutWarning, TaskPushMessage } from '@shared/types';
import { useTaskStore } from '@/store/taskStore';
import { useOfflineStore } from '@/store/offlineStore';
import { trackingService } from '@/services/tracking.service';

class WebSocketService {
  private socket: Socket | null = null;
  private riderId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private locationWatchId: number | null = null;
  private pendingLocations: LocationReportRequest[] = [];

  connect(riderId: string, token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.riderId = riderId;
    this.socket = io('/socket.io', {
      transports: ['websocket', 'polling'],
      auth: {
        token,
        riderId,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startLocationTracking();
      this.flushPendingLocations();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.stopLocationTracking();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connect error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        message.error('连接服务器失败，请检查网络');
      }
    });

    this.socket.on('task:push', (data: TaskPushMessage) => {
      console.log('Received task push:', data);
      message.info({
        content: `新任务：${data.orderType} - ${data.estimatedAmount}元`,
        duration: 5,
      });
      useTaskStore.getState().fetchAvailableTasks();
    });

    this.socket.on('task:assigned', (data: { task: TaskPool; order: Order }) => {
      console.log('Task assigned:', data);
      message.success('您有新的派单，请及时处理');
      useTaskStore.getState().setCurrentOrder(data.order);
      useTaskStore.getState().fetchCurrentTask();
    });

    this.socket.on('order:status_changed', (data: { orderId: string; status: string }) => {
      console.log('Order status changed:', data);
      const { currentOrder } = useTaskStore.getState();
      if (currentOrder?.id === data.orderId) {
        useTaskStore.getState().fetchOrderDetail(data.orderId);
        useTaskStore.getState().fetchCurrentTask();
      }
    });

    this.socket.on('warning:timeout', (data: TimeoutWarning) => {
      console.log('Timeout warning:', data);
      message.warning({
        content: `订单${data.orderId}即将超时，请加快速度！`,
        duration: 10,
      });
    });

    this.socket.on('message:system', (data: { title: string; content: string }) => {
      console.log('System message:', data);
      message.info({
        content: data.content,
        duration: 5,
      });
    });
  }

  disconnect() {
    this.stopLocationTracking();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.riderId = null;
  }

  private startLocationTracking() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationReportRequest = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        this.reportLocation(location);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 30000,
      }
    );
  }

  private stopLocationTracking() {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  private reportLocation(location: LocationReportRequest) {
    const { isOnline } = useOfflineStore.getState();

    if (isOnline && this.socket?.connected) {
      this.socket.emit('location:report', location);
    } else {
      this.pendingLocations.push(location);
      if (this.pendingLocations.length >= 10) {
        this.batchReportLocations();
      }
    }
  }

  private async batchReportLocations() {
    if (this.pendingLocations.length === 0) return;

    const locations = [...this.pendingLocations];
    this.pendingLocations = [];

    try {
      await trackingService.batchReportLocation({ locations });
    } catch (error) {
      console.error('Batch location report failed:', error);
      this.pendingLocations.unshift(...locations);
    }
  }

  private flushPendingLocations() {
    if (this.pendingLocations.length > 0) {
      this.batchReportLocations();
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
