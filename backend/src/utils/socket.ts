import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { memoryStore } from '../models/memoryStore';
import { JWTPayload, ChatMessage } from '../types';

interface SocketWithUser extends Socket {
  user?: JWTPayload;
}

export const setupSocket = (io: Server) => {
  io.use((socket: SocketWithUser, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('未授权'));
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Token无效'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    const userId = socket.user?.userId;
    console.log('User connected:', userId, socket.id);
    
    if (userId) {
      memoryStore.setOnlineUser(userId, socket.id);
      
      io.emit('user:online', { userId });
      
      socket.join(userId);
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', userId, socket.id);
      
      if (userId) {
        memoryStore.setOfflineUser(userId);
        io.emit('user:offline', { userId });
      }
    });

    socket.on('message:send', (data: { toUserId: string; content: string; type?: 'text' | 'image' | 'file' }) => {
      const fromUserId = socket.user?.userId;
      
      if (!fromUserId || !data.toUserId || !data.content) {
        socket.emit('message:error', { message: '参数错误' });
        return;
      }
      
      if (!memoryStore.isFriends(fromUserId, data.toUserId)) {
        socket.emit('message:error', { message: '你们不是好友关系' });
        return;
      }
      
      const message = memoryStore.createMessage(
        fromUserId,
        data.toUserId,
        data.content,
        data.type || 'text'
      );
      
      const fromUser = memoryStore.findUserById(fromUserId);
      const toUser = memoryStore.findUserById(data.toUserId);
      
      const messageWithUsers = {
        ...message,
        fromUser: fromUser ? { ...fromUser, password: undefined } : null,
        toUser: toUser ? { ...toUser, password: undefined } : null
      };
      
      socket.emit('message:sent', messageWithUsers);
      
      const toUserSocketId = memoryStore.isOnline(data.toUserId);
      if (toUserSocketId) {
        io.to(data.toUserId).emit('message:receive', messageWithUsers);
      }
    });

    socket.on('typing:start', (data: { toUserId: string }) => {
      const userId = socket.user?.userId;
      if (userId && data.toUserId) {
        io.to(data.toUserId).emit('typing:start', { fromUserId: userId });
      }
    });

    socket.on('typing:stop', (data: { toUserId: string }) => {
      const userId = socket.user?.userId;
      if (userId && data.toUserId) {
        io.to(data.toUserId).emit('typing:stop', { fromUserId: userId });
      }
    });

    socket.on('message:read', (data: { fromUserId: string }) => {
      const userId = socket.user?.userId;
      if (userId && data.fromUserId) {
        const count = memoryStore.markMessagesAsRead(data.fromUserId, userId);
        socket.emit('message:read:confirmed', { fromUserId: data.fromUserId, count });
      }
    });
  });
};

export default setupSocket;
