export type MessageType = 'announcement' | 'task' | 'chat';
export type MessageStatus = 'unread' | 'read' | 'deleted';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  status: MessageStatus;
  priority: 'high' | 'medium' | 'low';
  createTime: string;
  readTime?: string;
  attachments?: MessageAttachment[];
  bizType?: string;
  bizId?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatSession {
  id: string;
  type: 'single' | 'group';
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTop: boolean;
  isMute: boolean;
  memberIds: string[];
  draft?: string;
  lastMessageSender?: string;
  lastMessageContent?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  sendTime: string;
  createTime: string;
  isRead: boolean;
  isSelf: boolean;
  status: 'sending' | 'sent' | 'failed';
}
