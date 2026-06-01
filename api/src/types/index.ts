export interface Movie {
  id: string;
  title: string;
  poster: string;
  description: string;
  duration: number;
  release_date: string;
  genre: string;
  created_at: string;
}

export interface ScoreSource {
  source: string;
  score: number;
  vote_count: number;
}

export interface ScoreData {
  movie_id: string;
  sources: ScoreSource[];
  fused_score: number;
  heat_value: number;
}

export interface CastMember {
  id: string;
  movie_id: string;
  name: string;
  role: string;
  avatar: string;
  influence_weight: number;
}

export interface HeatTrend {
  id: string;
  movie_id: string;
  trend_date: string;
  value: number;
}

export interface Session {
  id: string;
  movie_id?: string;
  performance_id?: string;
  cinema_name: string;
  start_time: string;
  hall_type: string;
}

export interface Seat {
  id: string;
  session_id: string;
  row_num: number;
  col_num: number;
  status: 'available' | 'locked' | 'sold';
  seat_type: 'normal' | 'accessible' | 'couple' | 'vip';
  view_angle: number;
  price: number;
}

export interface SeatRecommendation {
  seats: Seat[];
  score: number;
  center_distance: number;
  view_score: number;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  is_vip: number;
  vip_level: number;
  view_history_vector: string;
  content_quality_score: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  session_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  coupon_id?: string;
  created_at: string;
}

export interface TicketContract {
  id: string;
  order_id: string;
  seat_id: string;
  seat_number: string;
  blockchain_hash: string;
  transfer_restricted: number;
  refund_policy: string;
  watermark_seed: string;
  created_at: string;
}

export interface VipPoints {
  id: string;
  user_id: string;
  points: number;
  source: string;
  expired_at?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  user_id: string;
  type: 'discount' | 'buy1get1' | 'free';
  value: number;
  is_used: number;
  expired_at?: string;
  created_at: string;
}

export interface UGCPost {
  id: string;
  user_id: string;
  movie_id?: string;
  title: string;
  content: string;
  quality_score: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  movie_id?: string;
  tags: string;
  completion_rate: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  publish_time: string;
}

export interface FilmFestival {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  created_at: string;
}

export interface FestivalSchedule {
  id: string;
  festival_id: string;
  movie_id: string;
  screening_time: string;
  venue: string;
}

export interface DirectorInterview {
  id: string;
  title: string;
  content: string;
  director_name: string;
  movie_id?: string;
  video_url: string;
  publish_date: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

export interface MovieWithScores extends Movie {
  scores: ScoreSource[];
  fused_score: number;
  heat_trends: HeatTrend[];
}

export interface RecommendResult {
  movie_id: string;
  rank_score: number;
  reasons: string[];
}

export interface WatermarkData {
  seed: string;
  user_id: string;
  order_id: string;
  timestamp: number;
  signature: string;
}

export interface VerifyResult {
  valid: boolean;
  ticket_id: string;
  seat_number: string;
  user_id: string;
  timestamp: number;
}
