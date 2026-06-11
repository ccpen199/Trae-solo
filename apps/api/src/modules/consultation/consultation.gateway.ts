import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConsultationService } from './consultation.service';
import { SendMessageDto } from './dto/consultation.dto';
import type { ConsultationMessage, ConsultationOrder } from '@pet/db';

interface AuthSocket extends Socket {
  userId?: string;
  role?: 'user' | 'doctor';
  consultationId?: string;
}

@WebSocketGateway({
  namespace: 'consultation',
  cors: {
    origin: '*',
  },
})
export class ConsultationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConsultationGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map();

  constructor(
    private readonly consultationService: ConsultationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: AuthSocket, ...args: any[]) {
    const { consultationId, userId, role } = client.handshake.query as any;

    if (!consultationId || !userId || !role) {
      this.logger.warn(`Client ${client.id} missing required query parameters`);
      client.disconnect();
      return;
    }

    try {
      const consultation = await this.consultationService.findOne(consultationId);

      const isUser = role === 'user' && consultation.userId === userId;
      const isDoctor = role === 'doctor' && consultation.doctorId === userId;

      if (!isUser && !isDoctor) {
        this.logger.warn(`Client ${client.id} not authorized for consultation ${consultationId}`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      client.role = role;
      client.consultationId = consultationId;

      const roomKey = `consultation:${consultationId}`;
      client.join(roomKey);

      if (!this.connectedClients.has(roomKey)) {
        this.connectedClients.set(roomKey, new Set());
      }
      this.connectedClients.get(roomKey)!.add(client.id);

      this.logger.log(
        `Client ${client.id} connected to consultation ${consultationId} as ${role}`,
      );

      this.server.to(roomKey).emit('user:joined', {
        userId,
        role,
        connectedAt: new Date().toISOString(),
      });

      this.server.to(roomKey).emit('online:status', {
        [role]: true,
        userId,
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthSocket) {
    const { consultationId, userId, role } = client;

    if (consultationId) {
      const roomKey = `consultation:${consultationId}`;
      const clients = this.connectedClients.get(roomKey);

      if (clients) {
        clients.delete(client.id);

        if (clients.size === 0) {
          this.connectedClients.delete(roomKey);
        }
      }

      this.logger.log(
        `Client ${client.id} disconnected from consultation ${consultationId}`,
      );

      this.server.to(roomKey).emit('user:left', {
        userId,
        role,
        disconnectedAt: new Date().toISOString(),
      });

      this.server.to(roomKey).emit('online:status', {
        [role!]: false,
        userId,
      });
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: Omit<SendMessageDto, 'senderId' | 'senderRole'>,
  ) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const messageDto: SendMessageDto = {
        ...payload,
        consultationId,
        senderId: userId,
        senderRole: role,
      };

      const message = await this.consultationService.sendMessage(messageDto);

      const roomKey = `consultation:${consultationId}`;
      this.server.to(roomKey).emit('message:received', message);

      return { success: true, data: message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('messages:read')
  async handleMarkMessagesAsRead(
    @ConnectedSocket() client: AuthSocket,
  ) {
    const { consultationId, userId } = client;

    if (!consultationId || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.consultationService.markMessagesAsRead(consultationId, userId);

      const roomKey = `consultation:${consultationId}`;
      this.server.to(roomKey).emit('messages:read', {
        userId,
        readAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(@ConnectedSocket() client: AuthSocket) {
    const { consultationId, userId, role } = client;

    if (consultationId && userId && role) {
      const roomKey = `consultation:${consultationId}`;
      client.to(roomKey).emit('typing:start', { userId, role });
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(@ConnectedSocket() client: AuthSocket) {
    const { consultationId, userId, role } = client;

    if (consultationId && userId && role) {
      const roomKey = `consultation:${consultationId}`;
      client.to(roomKey).emit('typing:stop', { userId, role });
    }
  }

  @SubscribeMessage('call:start')
  async handleCallStart(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { callType: 'voice' | 'video'; sdp?: string },
  ) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    const roomKey = `consultation:${consultationId}`;
    client.to(roomKey).emit('call:incoming', {
      userId,
      role,
      callType: payload.callType,
      sdp: payload.sdp,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { sdp?: string },
  ) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    const roomKey = `consultation:${consultationId}`;
    client.to(roomKey).emit('call:accepted', {
      userId,
      role,
      sdp: payload.sdp,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(@ConnectedSocket() client: AuthSocket) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    const roomKey = `consultation:${consultationId}`;
    client.to(roomKey).emit('call:rejected', {
      userId,
      role,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(@ConnectedSocket() client: AuthSocket) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    const roomKey = `consultation:${consultationId}`;
    client.to(roomKey).emit('call:ended', {
      userId,
      role,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('ice:candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { candidate: any },
  ) {
    const { consultationId, userId, role } = client;

    if (!consultationId || !userId || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    const roomKey = `consultation:${consultationId}`;
    client.to(roomKey).emit('ice:candidate', {
      userId,
      role,
      candidate: payload.candidate,
    });

    return { success: true };
  }

  @OnEvent('consultation.message.sent')
  handleMessageSentEvent(payload: { message: ConsultationMessage; consultation: ConsultationOrder }) {
    const { message, consultation } = payload;

    this.logger.log(
      `Message sent in consultation ${consultation.id} by ${message.senderRole} ${message.senderId}`,
    );
  }

  @OnEvent('consultation.status.changed')
  handleStatusChangedEvent(payload: { consultation: ConsultationOrder; status: string }) {
    const { consultation, status } = payload;
    const roomKey = `consultation:${consultation.id}`;

    this.server.to(roomKey).emit('status:changed', {
      status,
      consultationId: consultation.id,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('consultation.completed')
  handleConsultationCompletedEvent(payload: { consultation: ConsultationOrder }) {
    const { consultation } = payload;
    const roomKey = `consultation:${consultation.id}`;

    this.server.to(roomKey).emit('consultation:completed', {
      consultationId: consultation.id,
      completedAt: consultation.completedAt,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      const clients = this.connectedClients.get(roomKey);
      if (clients) {
        clients.forEach((clientId) => {
          const client = this.server.sockets.sockets.get(clientId);
          if (client) {
            client.leave(roomKey);
          }
        });
        this.connectedClients.delete(roomKey);
      }
    }, 5000);
  }

  getOnlineUsers(consultationId: string): { userId: string; role: 'user' | 'doctor' }[] {
    const roomKey = `consultation:${consultationId}`;
    const clients = this.connectedClients.get(roomKey);

    if (!clients) {
      return [];
    }

    const users: { userId: string; role: 'user' | 'doctor' }[] = [];
    clients.forEach((clientId) => {
      const client = this.server.sockets.sockets.get(clientId) as AuthSocket;
      if (client && client.userId && client.role) {
        users.push({ userId: client.userId, role: client.role });
      }
    });

    return users;
  }

  isUserOnline(consultationId: string, userId: string): boolean {
    const onlineUsers = this.getOnlineUsers(consultationId);
    return onlineUsers.some((u) => u.userId === userId);
  }
}
