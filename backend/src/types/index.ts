
export interface User {
  id: number;
  phone: string;
  nickname?: string;
  avatar?: string;
  role: 'parent' | 'grandparent' | 'friend' | 'admin';
  storage_used: number;
  storage_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Baby {
  id: number;
  user_id: number;
  name: string;
  gender?: 'male' | 'female';
  birthday?: string;
  avatar?: string;
  birth_weight?: number;
  birth_height?: number;
  created_at: string;
}

export interface Media {
  id: number;
  baby_id: number;
  user_id: number;
  type: 'photo' | 'video';
  file_path: string;
  thumbnail_path?: string;
  file_size?: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  taken_at?: string;
  location?: string;
  is_favorite: number;
  created_at: string;
}

export interface Moment {
  id: number;
  user_id: number;
  content?: string;
  media_ids?: string;
  like_count: number;
  comment_count: number;
  visibility: 'family' | 'public' | 'private';
  created_at: string;
}

export interface Comment {
  id: number;
  moment_id: number;
  user_id: number;
  content: string;
  reply_to?: number;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
}

export interface JwtPayload {
  userId: number;
  role: string;
}
