export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  poster: string;
  backdrop?: string;
  rating: number;
  ratings: {
    douban?: number;
    imdb?: number;
    rotten?: number;
    maoyan?: number;
  };
  genre: string[];
  duration: number;
  releaseDate: string;
  region: string;
  language: string;
  director: string;
  cast: string[];
  synopsis: string;
  heatScore: number;
  heatTrend: { date: string; value: number }[];
  tags: string[];
  status: 'showing' | 'upcoming' | 'offline';
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  distance?: string;
  halls: Hall[];
}

export interface Hall {
  id: string;
  name: string;
  type: 'standard' | 'imax' | 'dolby' | 'vip';
  capacity: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  price: number;
  vipPrice?: number;
  language: string;
  format: string;
}

export interface Seat {
  id: string;
  row: number;
  col: number;
  status: 'available' | 'occupied' | 'selected' | 'disabled';
  type: 'normal' | 'wheelchair' | 'vip' | 'sofa';
  viewAngleScore: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  movieId: string;
  showtimeId: string;
  seats: Seat[];
  totalPrice: number;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  movieTitle: string;
  poster: string;
  cinemaName: string;
  hallName: string;
  seat: string;
  startTime: string;
  endTime: string;
  price: number;
  qrCode: string;
  status: 'valid' | 'used' | 'expired';
  watermark?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  vipLevel: number;
  vipPoints: number;
  vipExpireDate?: string;
  coupons: Coupon[];
  watchHistory: string[];
  favorites: string[];
}

export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'free' | 'cash';
  value: number;
  minSpend?: number;
  expireDate: string;
  status: 'available' | 'used' | 'expired';
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  uploadTime: string;
  author: string;
  movieId?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  images?: string[];
  movieId?: string;
  movieTitle?: string;
  likes: number;
  comments: number;
  createdAt: string;
  tags: string[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'system' | 'promotion';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalMovies: number;
  dailyStats: { date: string; orders: number; revenue: number }[];
  topMovies: { title: string; sales: number }[];
  seatOccupancy: { time: string; rate: number }[];
}

export interface SeatSelectionState {
  selectedSeats: Seat[];
  maxSeats: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type PageType = 
  | 'home' 
  | 'all-movies'
  | 'movie' 
  | 'seat' 
  | 'tickets' 
  | 'ticket-detail' 
  | 'vip' 
  | 'videos' 
  | 'video-player'
  | 'art-film' 
  | 'community' 
  | 'admin' 
  | 'login'
  | 'register';
