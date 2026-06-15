export interface User {
  id: string;
  username: string;
  avatar: string;
  nickname: string;
  phone?: string;
  points: number;
  level: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  district: string;
}

export type PostCategory = 
  | 'traffic' 
  | 'environment' 
  | 'safety' 
  | 'life' 
  | 'culture' 
  | 'other';

export type PostStatus = 'pending' | 'approved' | 'rejected';

export type MediaType = 'image' | 'video';

export interface MediaItem {
  type: MediaType;
  url: string;
  thumbnail?: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  title: string;
  content: string;
  category: PostCategory;
  location?: Location;
  media: MediaItem[];
  status: PostStatus;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export type CircleCategory = 'photography' | 'parenting' | 'food' | 'outdoor' | 'fitness' | 'tech' | 'art';

export interface Circle {
  id: string;
  name: string;
  category: CircleCategory;
  description: string;
  avatar: string;
  coverImage: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  adminIds: string[];
  createdAt: string;
}

export interface Activity {
  id: string;
  circleId: string;
  circle?: Circle;
  title: string;
  description: string;
  coverImage: string;
  location?: Location;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  participantCount: number;
  participants: string[];
  fee: number;
  organizerId: string;
  organizer?: User;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
}

export type ServiceCategory = 'transport' | 'cinema' | 'jobs' | 'government';

export interface ServiceQuery {
  category: ServiceCategory;
  keyword?: string;
  params?: Record<string, any>;
}

export interface TransportService {
  type: 'bus' | 'train' | 'flight';
  route: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  available: boolean;
}

export interface CinemaService {
  cinemaName: string;
  movieTitle: string;
  startTime: string;
  endTime: string;
  hall: string;
  price: number;
  availableSeats: number;
}

export interface JobService {
  company: string;
  position: string;
  salary: string;
  location: string;
  requirements: string;
  postedDate: string;
}

export interface GovernmentService {
  name: string;
  department: string;
  description: string;
  requiredDocs: string[];
  processTime: string;
  appointmentUrl: string;
}

export type ServiceResult = TransportService | CinemaService | JobService | GovernmentService;

export interface PointRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  relatedId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  merchantName: string;
  title: string;
  description: string;
  discount: string;
  pointsRequired: number;
  image: string;
  validUntil: string;
  stock: number;
}

export interface DonationProject {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  pointsRequired: number;
  image: string;
}

export interface HeatmapData {
  district: string;
  count: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
