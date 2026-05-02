import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PORTS_CONFIG } from '../../config/ports';

@WebSocketGateway(PORTS_CONFIG.WEBSOCKET_PORT, {
  namespace: 'hospital',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class HospitalWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(HospitalWebSocketGateway.name);
  private readonly userRooms = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
        (client as any).userId = payload.sub;
        (client as any).role = payload.role;

        this.userRooms.set(client.id, new Set());
        this.joinRoom(client, `user:${payload.sub}`);

        this.logger.log(
          `WebSocket 连接: 用户 ${payload.sub} (${payload.role}) 已连接`,
        );
      }
    } catch (error) {
      this.logger.warn('WebSocket 连接认证失败');
    }
  }

  handleDisconnect(client: Socket) {
    const rooms = this.userRooms.get(client.id);
    if (rooms) {
      rooms.forEach((room) => client.leave(room));
      this.userRooms.delete(client.id);
    }
    this.logger.log(`WebSocket 断开: ${client.id}`);
  }

  private joinRoom(client: Socket, room: string) {
    client.join(room);
    const rooms = this.userRooms.get(client.id);
    if (rooms) {
      rooms.add(room);
    }
  }

  @SubscribeMessage('subscribe-queue')
  handleSubscribeQueue(
    @MessageBody() data: { doctorId?: string; departmentId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.doctorId) {
      this.joinRoom(client, `queue:doctor:${data.doctorId}`);
      this.logger.log(`客户端 ${client.id} 订阅医生队列: ${data.doctorId}`);
    }
    if (data.departmentId) {
      this.joinRoom(client, `queue:department:${data.departmentId}`);
      this.logger.log(`客户端 ${client.id} 订阅科室队列: ${data.departmentId}`);
    }
    return { status: 'subscribed' };
  }

  @SubscribeMessage('unsubscribe-queue')
  handleUnsubscribeQueue(
    @MessageBody() data: { doctorId?: string; departmentId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.doctorId) {
      client.leave(`queue:doctor:${data.doctorId}`);
      const rooms = this.userRooms.get(client.id);
      if (rooms) {
        rooms.delete(`queue:doctor:${data.doctorId}`);
      }
    }
    if (data.departmentId) {
      client.leave(`queue:department:${data.departmentId}`);
      const rooms = this.userRooms.get(client.id);
      if (rooms) {
        rooms.delete(`queue:department:${data.departmentId}`);
      }
    }
    return { status: 'unsubscribed' };
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }

  broadcastQueueUpdate(doctorId: string, queueData: any) {
    this.server.to(`queue:doctor:${doctorId}`).emit('queue-update', {
      doctorId,
      data: queueData,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`广播医生队列更新: ${doctorId}`);
  }

  broadcastDepartmentQueueUpdate(departmentId: string, queueData: any) {
    this.server.to(`queue:department:${departmentId}`).emit('queue-update', {
      departmentId,
      data: queueData,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`广播科室队列更新: ${departmentId}`);
  }

  broadcastQueueCalled(doctorId: string, queueNumber: number, patientId: string) {
    this.server.to(`queue:doctor:${doctorId}`).emit('queue-called', {
      doctorId,
      queueNumber,
      patientId,
      timestamp: new Date().toISOString(),
    });
    this.server.to(`user:${patientId}`).emit('my-turn', {
      doctorId,
      queueNumber,
      message: '请您就诊',
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`广播叫号: 医生 ${doctorId}，号 ${queueNumber}`);
  }

  broadcastRegistrationCreated(userId: string, registration: any) {
    this.server.to(`user:${userId}`).emit('registration-created', {
      registration,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastCheckIn(userId: string, checkInData: any) {
    this.server.to(`user:${userId}`).emit('check-in-success', {
      ...checkInData,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastAppointmentUpdated(userId: string, appointment: any) {
    this.server.to(`user:${userId}`).emit('appointment-updated', {
      appointment,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastRefundCompleted(userId: string, refund: any) {
    this.server.to(`user:${userId}`).emit('refund-completed', {
      refund,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastSystemMessage(message: string, type: string = 'info') {
    this.server.emit('system-message', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }
}
