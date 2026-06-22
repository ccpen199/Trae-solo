import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { TokenPayload, TaskPushMessage, RealtimeRiderStatus, LocationReport } from '@shared/types';
import { AppDataSource } from '../config/database';
import { RiderEntity } from '../entities/Rider.entity';
import { LocationReportEntity } from '../entities/LocationReport.entity';

interface ConnectedRider {
  socketId: string;
  riderId: string;
  lastPing: Date;
}

export class WebSocketService {
  private io: Server;
  private connectedRiders: Map<string, ConnectedRider> = new Map();
  private riderSockets: Map<string, string> = new Map();

  constructor(httpServer: createServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.initialize();
  }

  private initialize() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        const decoded = jwt.verify(
          token as string,
          process.env.JWT_SECRET || 'dispatch-secret-key-2024'
        ) as TokenPayload;

        const riderRepo = AppDataSource.getRepository(RiderEntity);
        const rider = await riderRepo.findOne({ where: { id: decoded.riderId } });

        if (!rider || rider.isFrozen) {
          return next(new Error('骑手不存在或已被冻结'));
        }

        socket.data.rider = rider;
        socket.data.riderId = decoded.riderId;
        next();
      } catch (err) {
        next(new Error('认证失败'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: Socket) {
    const riderId = socket.data.riderId;
    const rider = socket.data.rider;

    console.log(`骑手 ${riderId} 已连接 WebSocket`);

    const existingSocketId = this.riderSockets.get(riderId);
    if (existingSocketId) {
      this.io.sockets.sockets.get(existingSocketId)?.disconnect(true);
    }

    this.connectedRiders.set(riderId, {
      socketId: socket.id,
      riderId,
      lastPing: new Date(),
    });
    this.riderSockets.set(riderId, socket.id);

    const riderRepo = AppDataSource.getRepository(RiderEntity);
    await riderRepo.update(riderId, { isOnline: true });

    socket.on('location:report', async (data: LocationReport) => {
      try {
        await this.handleLocationReport(riderId, data);
      } catch (err) {
        console.error('处理定位上报失败:', err);
      }
    });

    socket.on('order:status', async (data: { orderId: string; status: string }) => {
      try {
        this.broadcastOrderStatus(data.orderId, data.status, riderId);
      } catch (err) {
        console.error('处理订单状态更新失败:', err);
      }
    });

    socket.on('ping', () => {
      const riderInfo = this.connectedRiders.get(riderId);
      if (riderInfo) {
        riderInfo.lastPing = new Date();
      }
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', async () => {
      await this.handleDisconnection(riderId, socket.id);
    });
  }

  private async handleLocationReport(riderId: string, data: LocationReport) {
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const locationRepo = AppDataSource.getRepository(LocationReportEntity);

    await riderRepo.update(riderId, {
      currentLocation: data.location,
      isOnline: true,
    });

    const locationReport = locationRepo.create({
      riderId,
      orderId: data.orderId,
      location: data.location,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      timestamp: data.timestamp || new Date(),
      isOnline: true,
      batteryLevel: data.batteryLevel,
    });

    await locationRepo.save(locationReport);

    if (data.orderId) {
      this.io.to(`order:${data.orderId}`).emit('location:update', {
        riderId,
        location: data.location,
        timestamp: new Date(),
      });
    }
  }

  private async handleDisconnection(riderId: string, socketId: string) {
    console.log(`骑手 ${riderId} 已断开 WebSocket 连接`);

    const riderInfo = this.connectedRiders.get(riderId);
    if (riderInfo && riderInfo.socketId === socketId) {
      this.connectedRiders.delete(riderId);
      this.riderSockets.delete(riderId);

      const riderRepo = AppDataSource.getRepository(RiderEntity);
      await riderRepo.update(riderId, { isOnline: false });
    }
  }

  public pushTaskToRider(riderId: string, task: TaskPushMessage): boolean {
    const socketId = this.riderSockets.get(riderId);
    if (socketId) {
      this.io.to(socketId).emit('task:push', task);
      return true;
    }
    return false;
  }

  public broadcastOrderStatus(orderId: string, status: string, riderId: string) {
    this.io.to(`order:${orderId}`).emit('order:status', {
      orderId,
      status,
      riderId,
      timestamp: new Date(),
    });
  }

  public sendTimeoutWarning(riderId: string, warning: { orderId: string; type: string; remainingMinutes: number }) {
    const socketId = this.riderSockets.get(riderId);
    if (socketId) {
      this.io.to(socketId).emit('warning:timeout', {
        ...warning,
        timestamp: new Date(),
      });
    }
  }

  public sendNotification(riderId: string, notification: { title: string; content: string; type: string; data?: unknown }) {
    const socketId = this.riderSockets.get(riderId);
    if (socketId) {
      this.io.to(socketId).emit('notification', {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    }
  }

  public getOnlineRiders(): RealtimeRiderStatus[] {
    const statuses: RealtimeRiderStatus[] = [];
    for (const [riderId, info] of this.connectedRiders.entries()) {
      const rider = AppDataSource.getRepository(RiderEntity).findOne({ where: { id: riderId } });
      if (rider) {
        statuses.push({
          riderId,
          isOnline: true,
          status: rider['currentTaskId'] ? 'on_task' : 'idle',
          lastUpdate: info.lastPing,
        });
      }
    }
    return statuses;
  }

  public isRiderOnline(riderId: string): boolean {
    return this.connectedRiders.has(riderId);
  }

  public getIo(): Server {
    return this.io;
  }
}

let websocketService: WebSocketService | null = null;

export const initWebSocketService = (httpServer: createServer) => {
  websocketService = new WebSocketService(httpServer);
  return websocketService;
};

export const getWebSocketService = () => {
  if (!websocketService) {
    throw new Error('WebSocket 服务未初始化');
  }
  return websocketService;
};
