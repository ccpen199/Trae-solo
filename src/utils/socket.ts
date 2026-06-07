import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const { token } = useAuthStore.getState();
    socket = io({
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const updateSocketAuth = (token: string | null): void => {
  if (socket) {
    socket.auth = {
      token: token ? `Bearer ${token}` : undefined,
    };
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
};

export default {
  getSocket,
  disconnectSocket,
  updateSocketAuth,
};
