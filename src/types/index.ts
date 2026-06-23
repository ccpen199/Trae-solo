export type HallType = 'IMAX' | '4DX' | 'Dolby' | 'Standard' | 'VIP';

export interface Hall {
  id: string;
  name: string;
  type: HallType;
  totalSeats: number;
  rows: number;
  cols: number;
  cinemaId: string;
  seatLayout: Seat[][];
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  imageUrl: string;
  distance?: number;
  halls: Hall[];
  hallTypes: HallType[];
  openingHours: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SeatStatus = 'available' | 'sold' | 'selected' | 'locked' | 'maintenance';

export type SeatZone = 'standard' | 'vip' | 'premium' | 'sweet' | 'golden';

export interface Seat {
  id: string;
  row: string;
  col: number;
  rowIndex: number;
  colIndex: number;
  status: SeatStatus;
  zone: SeatZone;
  isGoldenView: boolean;
  price: number;
  isAvailable: boolean;
  isWheelchairAccessible?: boolean;
  isCompanionSeat?: boolean;
  hallId: string;
}

export type MovieStatus = 'now_showing' | 'coming_soon' | 'offline' | 'preview';

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  likes: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  director: string;
  cast: string[];
  genre: string[];
  duration: number;
  language: string;
  region: string;
  releaseDate: Date;
  synopsis: string;
  trailerUrl?: string;
  stills?: string[];
  rating: number;
  ratingCount: number;
  status: MovieStatus;
  minPrice: number;
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
}

export type ShowtimeVersion = '2D' | '3D' | 'IMAX' | 'IMAX 3D' | 'Dolby Cinema' | '4DX';

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle?: string;
  cinemaId: string;
  cinemaName?: string;
  hallId: string;
  hallName?: string;
  hallType?: HallType;
  startTime: Date;
  endTime: Date;
  version: ShowtimeVersion;
  language: string;
  basePrice: number;
  isSoldOut: boolean;
  availableSeats: number;
  totalSeats: number;
  stopSellingAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ConcessionCategory = 'snack' | 'drink' | 'combo' | 'merchandise';

export interface DiscountRule {
  type: 'percentage' | 'fixed' | 'buy_get';
  value: number;
  minQuantity?: number;
  buyQuantity?: number;
  getQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface ComboItem {
  concessionId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface Concession {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: ConcessionCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
  isCombo: boolean;
  comboItems?: ComboItem[];
  discount?: DiscountRule;
  tags?: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  concession: Concession;
  quantity: number;
}

export type PACONNIELevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface MemberTask {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'daily' | 'growth' | 'limited';
  points: number;
  growthValue: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  avatar?: string;
  level: PACONNIELevel;
  points: number;
  pendingPoints: number;
  expiringPoints: number;
  expiringDate?: Date;
  growthValue: number;
  totalSpent: number;
  totalOrders: number;
  joinDate: Date;
  birthday?: Date;
  isPACONNIEMember: boolean;
  memberCardNo?: string;
  tasks?: MemberTask[];
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  concession: Concession;
  quantity: number;
}

export type RedeemCategory = 'concession' | 'merchandise' | 'ticket' | 'coupon' | 'partner';

export interface RedeemItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: RedeemCategory;
  pointsCost: number;
  pointsRequired: number;
  originalPoints?: number;
  stock: number;
  isActive: boolean;
  isHot?: boolean;
  isNew?: boolean;
  validFrom?: Date;
  validTo?: Date;
  limitPerMember?: number;
  redeemedCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PromotionType = 'discount' | 'flash_sale' | 'early_bird' | 'group_buy' | 'coupon' | 'points_discount';

export interface PromotionCondition {
  minOrderAmount?: number;
  minTicketCount?: number;
  validShowtimeIds?: string[];
  validMovieIds?: string[];
  validCinemaIds?: string[];
  validDaysOfWeek?: number[];
  validTimeRange?: {
    start: string;
    end: string;
  };
  memberLevels?: PACONNIELevel[];
  newUserOnly?: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: PromotionType;
  discountValue: number;
  discountUnit: 'percentage' | 'amount' | 'points';
  maxDiscountAmount?: number;
  code?: string;
  conditions: PromotionCondition;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  isActive: boolean;
  isFeatured?: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderType = 'ticket' | 'concession' | 'combo' | 'mixed';

export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';

export interface SeatInfo {
  seatId: string;
  row: string;
  col: number;
  rowIndex: number;
  colIndex: number;
  zone: SeatZone;
  price: number;
  isGoldenView: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  type: 'ticket' | 'concession';
  itemId: string;
  itemName: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  showtimeId?: string;
  hallId?: string;
  seats?: SeatInfo[];
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  cinemaId?: string;
  cinemaName?: string;
  showtimeId?: string;
  movieId?: string;
  movieTitle?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  pointsUsed: number;
  pointsDiscount: number;
  promotionIds?: string[];
  couponCode?: string;
  totalAmount: number;
  paidAmount: number;
  pointsEarned: number;
  growthValueEarned: number;
  paymentMethod?: string;
  paymentTime?: Date;
  verificationCode?: string;
  verificationQrCode?: string;
  expiresAt?: Date;
  isVerified: boolean;
  verifiedAt?: Date;
  notes?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
