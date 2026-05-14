import { useStore } from '../store/useStore';
import type { ChatMessage, OnlineUser, WebSocketMessage } from '../types';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const RECONNECT_DELAY = 3000;
const HEARTBEAT_INTERVAL = 20000;

const getWsUrl = (pageUrl?: string): string => {
  const token = localStorage.getItem('token') || '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  let url = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
  if (pageUrl) {
    url += `&pageUrl=${encodeURIComponent(pageUrl)}`;
  }
  
  return url;
};

const handleMessage = (event: MessageEvent) => {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);
    const { addChatMessage, setOnlineUsers, addOnlineUser, removeOnlineUser, updateOnlineUserScroll } = useStore.getState();
    
    switch (message.type) {
      case 'chat': {
        const msg = message.payload.message as ChatMessage;
        if (msg) {
          addChatMessage(msg);
        }
        break;
      }
      
      case 'user_list': {
        const users = message.payload.users as OnlineUser[];
        if (users) {
          setOnlineUsers(users);
        }
        break;
      }
      
      case 'user_join': {
        const payload = message.payload as { user?: OnlineUser; userId?: string };
        if (payload.user) {
          addOnlineUser(payload.user);
        }
        break;
      }
      
      case 'user_leave': {
        const payload = message.payload as { userId?: string };
        if (payload.userId) {
          removeOnlineUser(payload.userId);
        }
        break;
      }
      
      case 'scroll': {
        const payload = message.payload as { userId?: string; scrollPosition?: number };
        if (payload.userId && typeof payload.scrollPosition === 'number') {
          updateOnlineUserScroll(payload.userId, payload.scrollPosition);
        }
        break;
      }
      
      case 'heartbeat_ack':
        break;
    }
  } catch (error) {
    console.error('WebSocket message parse error:', error);
  }
};

const startHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', payload: {} }));
    }
  }, HEARTBEAT_INTERVAL);
};

const connect = (pageUrl?: string) => {
  if (ws) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      return;
    }
    ws = null;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }
  
  try {
    ws = new WebSocket(getWsUrl(pageUrl));
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      useStore.getState().setIsOnline(true);
      startHeartbeat();
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    ws.onmessage = handleMessage;
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      useStore.getState().setIsOnline(false);
      
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          connect(pageUrl);
        }, RECONNECT_DELAY);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('WebSocket connection error:', error);
  }
};

const disconnect = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (ws) {
    ws.close();
    ws = null;
  }
};

const send = (type: string, payload: Record<string, unknown>) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type, payload }));
    } catch (error) {
      console.error('WebSocket send error:', error);
    }
  }
};

export const websocketClient = {
  connect,
  disconnect,
  send,
  isConnected: () => ws?.readyState === WebSocket.OPEN,
  joinRoom: (pageUrl: string) => {
    send('join_room', { pageUrl });
  },
  sendChat: (content: string) => {
    send('chat', { content });
  },
  updateScroll: (scrollPosition: number) => {
    send('scroll', { scrollPosition });
  },
};
