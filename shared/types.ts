export interface User {
  id: string;
  username: string;
  avatar?: string;
  role: 'user' | 'creator' | 'admin' | 'requester';
  bio?: string;
  followerCount: number;
  followingCount: number;
  rating: number;
  verified: boolean;
  location?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  creatorId: string;
  creator?: User;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  price: number;
  subscriptionPrice?: number;
  isSubscription: boolean;
  studentCount: number;
  rating: number;
  reviewCount: number;
  chapterCount?: number;
  totalDuration?: number;
  status: 'draft' | 'reviewing' | 'published' | 'rejected';
  createdAt: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface ServiceOrder {
  id: string;
  requesterId: string;
  requester?: User;
  creatorId?: string;
  creator?: User;
  title: string;
  description?: string;
  category?: string;
  price: number;
  deposit: number;
  location?: string;
  serviceTime?: string;
  duration: number;
  status: 'published' | 'matched' | 'confirmed' | 'deposit_paid' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  insurancePolicy?: string;
  insuranceRequired?: boolean;
  requirements?: string;
  contactPhone?: string;
  bookingNo?: string;
  checkInTime?: string;
  checkOutTime?: string;
  actualDuration?: number;
  gpsDistance?: number;
  createdAt: string;
}

export interface ServiceTrace {
  id: string;
  orderId: string;
  type: string;
  content?: string;
  operatorId?: string;
  operator?: User;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId?: string;
  courseId?: string;
  userId: string;
  user?: User;
  rating: number;
  content?: string;
  tags?: string[];
  images?: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  orderId?: string;
  courseId?: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  platformFee: number;
  type: 'course_purchase' | 'service_deposit' | 'service_final' | 'subscription' | 'settlement';
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  contentType: 'course' | 'video' | 'profile' | 'service';
  contentId: string;
  submitterId: string;
  submitter?: User;
  reviewerId?: string;
  reviewer?: User;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  autoCheckPassed: boolean;
  createdAt: string;
  reviewedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  frozenBalance: number;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
