import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:station', (stationId: string) => {
      socket.join(`station:${stationId}`);
      logger.info(`Socket ${socket.id} joined station:${stationId}`);
    });

    socket.on('leave:station', (stationId: string) => {
      socket.leave(`station:${stationId}`);
      logger.info(`Socket ${socket.id} left station:${stationId}`);
    });

    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.info(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      logger.info(`Socket ${socket.id} left order:${orderId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('leave:user', (userId: string) => {
      socket.leave(`user:${userId}`);
      logger.info(`Socket ${socket.id} left user:${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToStation = (stationId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`station:${stationId}`).emit(event, data);
};

export const emitToOrder = (orderId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`order:${orderId}`).emit(event, data);
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export default {
  initSocket,
  getIO,
  emitToStation,
  emitToOrder,
  emitToUser,
};
