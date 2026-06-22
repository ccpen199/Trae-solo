export interface User {
  id: string;
  phone: string;
  email: string;
  nickname: string;
  avatar: string;
  role: 'user' | 'creator' | 'circle_admin' | 'editor' | 'government' | 'merchant';
  points: number;
  level: number;
  location?: {
    district: string;
    address: string;
  };
  createdAt: Date;
  lastLoginAt: Date;
  isSignedInToday: boolean;
}

export interface Baoliao {
  id: string;
  userId: string;
  user: User;
  title: string;
  content: string;
  images: string[];
  video?: string;
  category: 'traffic' | 'environment' | 'facility' | 'livelihood' | 'emergency' | 'other';
  categoryName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
    street?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
}

export interface BaoliaoComment {
  id: string;
  baoliaoId: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  createdAt: Date;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  category: 'photography' | 'parenting' | 'food' | 'outdoor' | 'sports' | 'culture' | 'other';
  categoryName: string;
  memberCount: number;
  postCount: number;
  activityCount: number;
  adminId: string;
  admin: User;
  isJoined: boolean;
  tags: string[];
  createdAt: Date;
}

export interface Activity {
  id: string;
  circleId: string;
  circle: Circle;
  organizerId: string;
  organizer: User;
  title: string;
  description: string;
  coverImage: string;
  location: string;
  address: string;
  lat?: number;
  lng?: number;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  currentParticipants: number;
  participants: User[];
  status: 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
  isRegistered: boolean;
  images: string[];
  createdAt: Date;
}

export interface BusSchedule {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  seatsAvailable: number;
  busType: string;
  operator: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: number;
  duration: string;
  genre: string[];
  releaseDate: string;
  description: string;
  nowShowing: boolean;
}

export interface CinemaSchedule {
  id: string;
  movieId: string;
  movie: Movie;
  cinemaName: string;
  hall: string;
  time: string;
  price: number;
  seatsAvailable: number;
  language: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  district: string;
  experience: string;
  education: string;
  tags: string[];
  description: string;
  publishDate: string;
}

export interface GovernmentService {
  id: string;
  name: string;
  category: string;
  department: string;
  description: string;
  requiredMaterials: string[];
  processingTime: string;
  fee: string;
  onlineBooking: boolean;
  bookingUrl?: string;
}

export interface BookingRecord {
  id: string;
  serviceId: string;
  service: GovernmentService;
  userId: string;
  bookingDate: Date;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface PointRecord {
  id: string;
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  balance: number;
  reason: string;
  source: 'login' | 'publish_baoliao' | 'join_activity' | 'invite' | 'exchange' | 'donate';
  relatedId?: string;
  createdAt: Date;
}

export interface PointTask {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'daily' | 'weekly' | 'one_time';
  icon: string;
  action: string;
  source?: 'login' | 'publish_baoliao' | 'join_activity' | 'invite' | 'exchange' | 'donate';
  completed: boolean;
  progress?: number;
  target?: number;
}

export interface MallItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: 'coupon' | 'physical' | 'donation';
  merchantName?: string;
  stock: number;
  sold: number;
  expiryDate?: Date;
  discountRate?: number;
}

export interface HeatmapData {
  district: string;
  street?: string;
  count: number;
  positive: number;
  neutral: number;
  negative: number;
  center: [number, number];
}

export interface DailyStats {
  date: string;
  baoliaoCount: number;
  userCount: number;
  activityCount: number;
  positiveRate: number;
}
