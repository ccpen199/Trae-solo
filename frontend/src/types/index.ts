export interface Video {
  id: number;
  title: string;
  description: string;
  duration: number;
  url: string;
  thumbnail: string;
  status: string;
  is_vip: boolean;
  album_id?: number;
  episode_no?: number;
  aspect_ratio: string;
  created_at: string;
  updated_at: string;
  qualities?: VideoQuality[];
}

export interface VideoQuality {
  id: number;
  video_id: number;
  quality: string;
  url: string;
  bandwidth: number;
}

export interface Advertisement {
  id: number;
  type: string;
  title: string;
  video_url: string;
  duration: number;
  target_url?: string;
  status: string;
  position: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  is_vip: boolean;
  vip_expire_at?: string;
  is_vip_valid?: boolean;
  vip_expired?: boolean;
}

export interface PlayRecord {
  id: number;
  user_id?: number;
  video_id: number;
  progress: number;
  duration: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  title?: string;
  thumbnail?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

export type PlayerState = 'loading' | 'ad' | 'playing' | 'paused' | 'error' | 'vip_required';

export type ProgressStatus = 'unloaded' | 'loaded' | 'played' | 'seeking';
