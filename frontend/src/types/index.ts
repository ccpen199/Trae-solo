export interface User {
  id: number;
  phone?: string;
  nickname: string;
  avatar: string;
  gender?: string;
  bio?: string;
  birthday?: string;
  location?: string;
  created_at?: string;
  personality_type?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Post {
  id: number;
  user_id: number;
  nickname: string;
  avatar: string;
  content: string;
  images: string[];
  location?: string;
  created_at: string;
  like_count: number;
  is_liked: boolean;
}

export interface Question {
  id: number;
  question: string;
  options: { value: number; label: string }[];
}

export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content: string;
  is_read: number;
  created_at: string;
}

export interface Conversation {
  user_id: number;
  nickname: string;
  avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}
