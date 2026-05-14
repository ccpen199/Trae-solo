export interface AvatarConfig {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  outfit: string;
  accessory?: string;
}

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatarConfig: AvatarConfig;
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  avatarConfig: AvatarConfig;
  content: string;
  messageType: 'text' | 'emoji' | 'system';
  createdAt: string;
}

export interface OnlineUser {
  userId: string;
  nickname: string;
  avatarConfig: AvatarConfig;
  scrollPosition: number;
}

export interface Post {
  id: string;
  userId: string;
  nickname: string;
  avatarConfig: AvatarConfig;
  content: string;
  pageUrl?: string;
  pageTitle?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  nickname: string;
  avatarConfig: AvatarConfig;
  content: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isJoined: boolean;
  role?: string;
  createdAt: string;
}

export interface CommunityMember {
  userId: string;
  nickname: string;
  avatarConfig: AvatarConfig;
  role: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface WebSocketMessage {
  type: 'user_join' | 'user_leave' | 'chat' | 'scroll' | 'user_list' | 'heartbeat_ack';
  payload: Record<string, unknown>;
}
