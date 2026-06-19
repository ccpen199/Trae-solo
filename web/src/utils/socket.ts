import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = useAuthStore.getState().token;
    this.socket = io({
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.emit('connection', true);
    });

    this.socket.on('disconnect', () => {
      this.emit('connection', false);
    });

    this.socket.on('device:status', (data) => {
      this.emit('device:status', data);
    });

    this.socket.on('device:command', (data) => {
      this.emit('device:command', data);
    });

    this.socket.on('order:update', (data) => {
      this.emit('order:update', data);
    });

    this.socket.on('workorder:update', (data) => {
      this.emit('workorder:update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }

  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
