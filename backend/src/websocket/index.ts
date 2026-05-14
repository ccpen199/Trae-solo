import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../utils/jwt';
import { getDb } from '../database';
import { hashUrl, generateId } from '../utils/crypto';

interface WsClient extends WebSocket {
  userId?: string;
  pageUrlHash?: string;
  isAlive?: boolean;
}

interface Room {
  clients: Set<string>;
}

const rooms = new Map<string, Room>();
const clients = new Map<string, WsClient>();

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WsClient, req: IncomingMessage) => {
    const clientId = generateId();
    ws.isAlive = true;
    clients.set(clientId, ws);
    
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token') || '';
    const pageUrl = url.searchParams.get('pageUrl') || '';
    
    const payload = verifyToken(token);
    if (!payload) {
      ws.close(4401, 'Unauthorized');
      return;
    }
    
    ws.userId = payload.userId;
    
    if (pageUrl) {
      const pageUrlHash = hashUrl(pageUrl);
      joinRoom(ws, clientId, pageUrlHash);
    }
    
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, clientId, message);
      } catch (error) {
        console.error('Parse message error:', error);
      }
    });
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('close', () => {
      handleDisconnect(ws, clientId);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      handleDisconnect(ws, clientId);
    });
  });
  
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WsClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
};

const joinRoom = (ws: WsClient, clientId: string, pageUrlHash: string) => {
  if (!ws.userId) return;
  
  ws.pageUrlHash = pageUrlHash;
  
  if (!rooms.has(pageUrlHash)) {
    rooms.set(pageUrlHash, { clients: new Set() });
  }
  
  const room = rooms.get(pageUrlHash)!;
  room.clients.add(clientId);
  
  const db = getDb();
  const presenceId = generateId();
  
  try {
    db.prepare(`
      INSERT INTO page_presence (id, user_id, page_url_hash, scroll_position, is_active, last_seen)
      VALUES (?, ?, ?, 0, 1, datetime('now'))
      ON CONFLICT(user_id, page_url_hash) DO UPDATE SET
        is_active = 1,
        last_seen = datetime('now')
    `).run(presenceId, ws.userId, pageUrlHash);
  } catch (error) {
    console.error('Update presence error:', error);
  }
  
  broadcastToRoom(pageUrlHash, {
    type: 'user_join',
    payload: {
      userId: ws.userId,
      clientId,
    },
  }, clientId);
  
  sendUserList(ws, pageUrlHash);
};

const leaveRoom = (ws: WsClient, clientId: string, pageUrlHash: string) => {
  const room = rooms.get(pageUrlHash);
  if (!room) return;
  
  room.clients.delete(clientId);
  
  if (room.clients.size === 0) {
    rooms.delete(pageUrlHash);
  }
  
  if (ws.userId) {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE page_presence
        SET is_active = 0, last_seen = datetime('now')
        WHERE user_id = ? AND page_url_hash = ?
      `).run(ws.userId, pageUrlHash);
    } catch (error) {
      console.error('Update presence error:', error);
    }
  }
  
  broadcastToRoom(pageUrlHash, {
    type: 'user_leave',
    payload: {
      userId: ws.userId,
      clientId,
    },
  });
};

const handleDisconnect = (ws: WsClient, clientId: string) => {
  clients.delete(clientId);
  
  if (ws.pageUrlHash) {
    leaveRoom(ws, clientId, ws.pageUrlHash);
  }
};

const handleMessage = (ws: WsClient, clientId: string, message: { type: string; payload: Record<string, unknown> }) => {
  const { type, payload } = message;
  
  switch (type) {
    case 'join_room':
      if (payload.pageUrl && typeof payload.pageUrl === 'string') {
        const pageUrlHash = hashUrl(payload.pageUrl);
        if (ws.pageUrlHash && ws.pageUrlHash !== pageUrlHash) {
          leaveRoom(ws, clientId, ws.pageUrlHash);
        }
        joinRoom(ws, clientId, pageUrlHash);
      }
      break;
      
    case 'scroll':
      if (ws.userId && ws.pageUrlHash && typeof payload.scrollPosition === 'number') {
        const db = getDb();
        try {
          db.prepare(`
            UPDATE page_presence
            SET scroll_position = ?, last_seen = datetime('now')
            WHERE user_id = ? AND page_url_hash = ?
          `).run(payload.scrollPosition, ws.userId, ws.pageUrlHash);
        } catch (error) {
          console.error('Update scroll error:', error);
        }
        
        broadcastToRoom(ws.pageUrlHash, {
          type: 'scroll',
          payload: {
            userId: ws.userId,
            scrollPosition: payload.scrollPosition,
          },
        }, clientId);
      }
      break;
      
    case 'chat':
      if (ws.userId && ws.pageUrlHash && payload.content && typeof payload.content === 'string') {
        handleChatMessage(ws, clientId, payload.content);
      }
      break;
      
    case 'heartbeat':
      ws.isAlive = true;
      ws.send(JSON.stringify({ type: 'heartbeat_ack', payload: {} }));
      break;
      
    default:
      break;
  }
};

const handleChatMessage = (ws: WsClient, clientId: string, content: string) => {
  if (!ws.userId || !ws.pageUrlHash) return;
  
  const db = getDb();
  const pageUrlHash = ws.pageUrlHash;
  
  let room = db
    .prepare('SELECT id FROM chat_rooms WHERE page_url_hash = ?')
    .get(pageUrlHash) as { id: string } | undefined;
  
  if (!room) {
    const roomId = generateId();
    db.prepare(`
      INSERT INTO chat_rooms (id, page_url_hash, online_count)
      VALUES (?, ?, 0)
    `).run(roomId, pageUrlHash);
    room = { id: roomId };
  }
  
  const messageId = generateId();
  db.prepare(`
    INSERT INTO chat_messages (id, room_id, user_id, content, message_type)
    VALUES (?, ?, ?, ?, 'text')
  `).run(messageId, room.id, ws.userId, content);
  
  const message = db
    .prepare(`
      SELECT m.*, u.nickname, u.avatar_config
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `)
    .get(messageId) as {
      id: string;
      user_id: string;
      content: string;
      message_type: string;
      created_at: string;
      nickname: string;
      avatar_config: string;
    };
  
  broadcastToRoom(pageUrlHash, {
    type: 'chat',
    payload: {
      message: {
        id: message.id,
        userId: message.user_id,
        nickname: message.nickname,
        avatarConfig: JSON.parse(message.avatar_config || '{}'),
        content: message.content,
        messageType: message.message_type,
        createdAt: message.created_at,
      },
    },
  });
};

const sendUserList = (ws: WsClient, pageUrlHash: string) => {
  if (!ws.userId) return;
  
  const db = getDb();
  const users = db
    .prepare(`
      SELECT p.user_id, u.nickname, u.avatar_config, p.scroll_position
      FROM page_presence p
      JOIN users u ON p.user_id = u.id
      WHERE p.page_url_hash = ? AND p.is_active = 1
      AND p.last_seen > datetime('now', '-5 minutes')
    `)
    .all(pageUrlHash) as Array<{
      user_id: string;
      nickname: string;
      avatar_config: string;
      scroll_position: number;
    }>;
  
  ws.send(
    JSON.stringify({
      type: 'user_list',
      payload: {
        users: users.map((u) => ({
          userId: u.user_id,
          nickname: u.nickname,
          avatarConfig: JSON.parse(u.avatar_config || '{}'),
          scrollPosition: u.scroll_position,
        })),
      },
    })
  );
};

const broadcastToRoom = (pageUrlHash: string, message: unknown, excludeClientId?: string) => {
  const room = rooms.get(pageUrlHash);
  if (!room) return;
  
  const messageStr = JSON.stringify(message);
  
  room.clients.forEach((clientId) => {
    if (excludeClientId && clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};
