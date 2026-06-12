import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { db } from './database';
import { filterSensitiveWords, checkMessageQuality } from './utils';

const userSockets = new Map<string, Set<string>>();

export function initSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: { origin: config.frontendUrl, credentials: true }
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('未授权'));
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const user = db.prepare('SELECT id, name, role, tenant_id FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active') as any;
      if (!user) return next(new Error('用户不存在'));
      (socket as any).user = { id: user.id, name: user.name, role: user.role, tenantId: user.tenant_id };
      next();
    } catch (e) {
      next(new Error('令牌无效'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!userSockets.has(user.id)) userSockets.set(user.id, new Set());
    userSockets.get(user.id)!.add(socket.id);

    socket.join(`user:${user.id}`);
    socket.join(`tenant:${user.tenantId}`);

    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('send_message', async (data: { sessionId: string; content: string; type?: string; fileUrl?: string }) => {
      const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(data.sessionId) as any;
      if (!session) return;
      const receiverId = session.user1_id === user.id ? session.user2_id : session.user1_id;
      const type = data.type || 'text';
      const filtered = filterSensitiveWords(data.content || '');
      const quality = checkMessageQuality(data.content || '');
      const id = uuidv4();
      db.prepare('INSERT INTO chat_messages (id, session_id, sender_id, receiver_id, type, content, file_url, is_blocked, block_reason, quality_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, data.sessionId, user.id, receiverId, type, filtered.text, data.fileUrl || null, filtered.blocked ? 1 : 0, filtered.matchedWords.join(',') || null, quality.score);
      db.prepare('UPDATE chat_sessions SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(filtered.text.substring(0, 100), data.sessionId);

      const messageData = {
        id, sessionId: data.sessionId, senderId: user.id, senderName: user.name,
        content: filtered.text, type, fileUrl: data.fileUrl || null,
        isRead: 0, isBlocked: filtered.blocked, qualityScore: quality.score,
        createdAt: new Date().toISOString()
      };

      io.to(`session:${data.sessionId}`).emit('new_message', messageData);

      const notifId = uuidv4();
      db.prepare('INSERT INTO notifications (id, user_id, tenant_id, type, title, content) VALUES (?, ?, ?, ?, ?, ?)')
        .run(notifId, receiverId, user.tenantId, 'chat_message', `${user.name} 发送了新消息`, filtered.text.substring(0, 50));
      sendToUser(receiverId, 'new_notification', { id: notifId, title: `${user.name} 发送了新消息` });
    });

    socket.on('mark_read', (data: { sessionId: string }) => {
      db.prepare('UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND receiver_id = ? AND is_read = 0').run(data.sessionId, user.id);
      io.to(`session:${data.sessionId}`).emit('messages_read', { sessionId: data.sessionId, readerId: user.id });
    });

    socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
      socket.to(`session:${data.sessionId}`).emit('user_typing', { sessionId: data.sessionId, userId: user.id, userName: user.name, isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
      const set = userSockets.get(user.id);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(user.id);
      }
    });
  });

  return io;
}

export function sendToUser(userId: string, event: string, data: any) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach(sid => {
      const io = (global as any)._io as SocketIOServer | undefined;
      io?.to(sid).emit(event, data);
    });
  }
}
