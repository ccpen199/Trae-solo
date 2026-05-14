export interface User {
  id: string;
  username: string;
  password_hash: string;
  nickname: string;
  avatar_config: string;
  created_at: string;
  updated_at: string;
}

export interface AvatarConfig {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  outfit: string;
  accessory?: string;
}

export interface ChatRoom {
  id: string;
  page_url_hash: string;
  page_title?: string;
  online_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'emoji' | 'system';
  created_at: string;
}

export interface PagePresence {
  id: string;
  user_id: string;
  page_url_hash: string;
  scroll_position: number;
  is_active: boolean;
  last_seen: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  page_url?: string;
  page_title?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  member_count: number;
  created_at: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
}

export interface WebSocketMessage {
  type: 'join_room' | 'leave_room' | 'chat' | 'scroll' | 'user_list' | 'presence';
  payload: Record<string, unknown>;
}
