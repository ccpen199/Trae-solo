import { io, Socket } from 'socket.io-client';
import type { ServerEventMap, ClientEventMap, Order, RiderLocation, OrderAlert, DashboardMetrics, OrderStatus } from '@/types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

type EventCallback<T> = (data: T) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;

type ServerEvents = {
  [K in keyof ServerEventMap]: EventCallback<ServerEventMap[K]>;
};

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private connectionStatusListeners: Set<ConnectionStatusCallback> = new Set();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.connectionStatusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('[WebSocket] Status listener error:', e);
      }
    });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  onConnectionChange(callback: ConnectionStatusCallback): () => void {
    this.connectionStatusListeners.add(callback);
    callback(this.connectionStatus);
    return () => {
      this.connectionStatusListeners.delete(callback);
    };
  }

  connect(url?: string): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.updateConnectionStatus('connecting');

    const wsUrl = url || import.meta.env.VITE_WS_URL || window.location.origin;
    const token = localStorage.getItem('auth_token');

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 30000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        this.updateConnectionStatus('disconnected');
      } else {
        this.updateConnectionStatus('reconnecting');
      }
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.updateConnectionStatus('error');
        console.error('[WebSocket] Max reconnection attempts reached');
      } else {
        this.updateConnectionStatus('reconnecting');
      }
      console.warn(`[WebSocket] Connection error (attempt ${this.reconnectAttempts}):`, error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', () => {
      this.updateConnectionStatus('reconnecting');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.updateConnectionStatus('disconnected');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on<K extends keyof ServerEventMap>(event: K, callback: ServerEvents[K]): () => void {
    if (!this.socket) {
      this.connect();
    }

    const listener = callback as (...args: unknown[]) => void;
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(listener);

    (this.socket!.on as (event: string, callback: (...args: unknown[]) => void) => Socket)(event as string, listener);

    return () => {
      this.off(event, callback);
    };
  }

  off<K extends keyof ServerEventMap>(event: K, callback: ServerEvents[K]): void {
    const listener = callback as (...args: unknown[]) => void;
    (this.socket?.off as (event: string, callback: (...args: unknown[]) => void) => Socket | undefined)?.(event as string, listener);
    this.listeners.get(event as string)?.delete(listener);
  }

  emit<K extends keyof ClientEventMap>(event: K, ...args: Parameters<ClientEventMap[K]>): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket!.emit(event, ...args);
  }

  subscribe(channels: string[]): void {
    this.emit('dashboard:subscribe', channels);
  }

  unsubscribe(channels: string[]): void {
    this.emit('dashboard:unsubscribe', channels);
  }

  onOrderStatusChange(callback: (data: { orderId: string; status: OrderStatus; timestamp: string }) => void): () => void {
    return this.on('order:status', callback);
  }

  onNewOrder(callback: (order: Order) => void): () => void {
    return this.on('order:new', callback);
  }

  onRiderLocation(callback: (location: RiderLocation) => void): () => void {
    return this.on('rider:location', callback);
  }

  onOrderAlert(callback: (alert: OrderAlert) => void): () => void {
    return this.on('order:alert', callback);
  }

  onDashboardMetrics(callback: (metrics: DashboardMetrics) => void): () => void {
    return this.on('dashboard:metrics', callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();

export default websocketService;
