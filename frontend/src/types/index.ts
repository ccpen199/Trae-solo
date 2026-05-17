export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar?: string;
  age?: number;
  gender?: string;
}

export interface SleepRecord {
  id: number;
  user_id: number;
  sleep_date: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  deep_sleep_duration?: number;
  light_sleep_duration?: number;
  rem_sleep_duration?: number;
  awake_duration?: number;
  avg_heart_rate?: number;
  avg_temperature?: number;
  movement_count?: number;
  wake_up_count?: number;
  snoring_duration?: number;
  sleep_talking_count?: number;
  sleep_quality_score?: number;
  status: string;
  created_at: string;
}

export interface SleepStats {
  sleep_date: string;
  duration?: number;
  deep_sleep_duration?: number;
  sleep_quality_score?: number;
}

export interface SleepSummary {
  totalDays: number;
  avgDuration: number;
  avgDeepSleep: number;
  avgScore: number;
}

export interface SleepMusic {
  id: number;
  name: string;
  category: string;
  url: string;
  duration?: number;
  description?: string;
  cover_image?: string;
  play_count: number;
  is_active: number;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  is_official: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  likes_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  preferred_music_categories?: string;
  sleep_goal_hours: number;
  wake_up_time?: string;
  bed_time?: string;
  notifications_enabled: number;
  auto_stop_music: number;
  smart_device_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
  age?: number;
  gender?: string;
}
