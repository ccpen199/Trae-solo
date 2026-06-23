import { Message, ChatSession, ChatMessage } from '@/types/message';
import { mockMessages, mockChatSessions, mockChatMessages, mockUnreadStats } from '@/data/mockMessage';

export const messageService = {
  async getMessageList(type?: string, page: number = 1, pageSize: number = 20): Promise<{ list: Message[]; total: number }> {
    console.log('[MessageService] Get messages:', type);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let list = mockMessages;
    if (type && type !== 'all') {
      list = list.filter(m => m.type === type);
    }
    
    return {
      list: list.slice((page - 1) * pageSize, page * pageSize),
      total: list.length
    };
  },

  async getUnreadStats(): Promise<{ total: number; announcement: number; task: number; chat: number }> {
    console.log('[MessageService] Get unread stats');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockUnreadStats;
  },

  async getUnreadCount(): Promise<number> {
    console.log('[MessageService] Get unread count');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockUnreadStats.total;
  },

  async markAsRead(messageIds: string[]): Promise<void> {
    console.log('[MessageService] Mark as read:', messageIds);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async markAllAsRead(type?: string): Promise<void> {
    console.log('[MessageService] Mark all as read:', type);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async deleteMessage(messageId: string): Promise<void> {
    console.log('[MessageService] Delete message:', messageId);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async getChatSessions(): Promise<ChatSession[]> {
    console.log('[MessageService] Get chat sessions');
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockChatSessions;
  },

  async getChatMessages(sessionId: string, page: number = 1, pageSize: number = 50): Promise<{ list: ChatMessage[]; total: number }> {
    console.log('[MessageService] Get chat messages:', sessionId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const list = mockChatMessages.filter(m => m.sessionId === sessionId);
    return {
      list: list.slice((page - 1) * pageSize, page * pageSize),
      total: list.length
    };
  },

  async sendMessage(sessionId: string, content: string, type: string = 'text'): Promise<ChatMessage> {
    console.log('[MessageService] Send message:', sessionId, content);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const createTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const newMessage: ChatMessage = {
      id: 'cm_' + Date.now(),
      sessionId,
      senderId: 'u001',
      senderName: '张明',
      senderAvatar: 'https://picsum.photos/id/64/200/200',
      content,
      type: type as any,
      sendTime: createTime,
      createTime,
      isRead: false,
      isSelf: true,
      status: 'sent'
    };
    
    return newMessage;
  },

  async createChatSession(type: 'single' | 'group', memberIds: string[], name?: string): Promise<ChatSession> {
    console.log('[MessageService] Create chat session:', type, memberIds);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const session: ChatSession = {
      id: 'chat_' + Date.now(),
      type,
      name: name || '新会话',
      avatar: 'https://picsum.photos/id/1/200/200',
      lastMessage: '',
      lastMessageTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      unreadCount: 0,
      isTop: false,
      isMute: false,
      memberIds
    };
    
    return session;
  },

  async setSessionTop(sessionId: string, isTop: boolean): Promise<void> {
    console.log('[MessageService] Set session top:', sessionId, isTop);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async setSessionMute(sessionId: string, isMute: boolean): Promise<void> {
    console.log('[MessageService] Set session mute:', sessionId, isMute);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async getAnnouncements(page: number = 1, pageSize: number = 10): Promise<{ list: Message[]; total: number }> {
    return this.getMessageList('announcement', page, pageSize);
  },

  async getTasks(page: number = 1, pageSize: number = 10): Promise<{ list: Message[]; total: number }> {
    return this.getMessageList('task', page, pageSize);
  }
};

export default messageService;
