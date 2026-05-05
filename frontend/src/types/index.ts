export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
}

export interface Host {
  id: string;
  userId: string;
  realName: string;
  verifyStatus: boolean;
  intro?: string;
  responseRate: number;
  responseTime: number;
  user?: Pick<User, 'nickname' | 'avatar'>;
}

export interface City {
  id: string;
  name: string;
  nameEn?: string;
  country: string;
  province?: string;
  pinyin?: string;
  isHot: boolean;
  isDomestic: boolean;
  lat?: number;
  lng?: number;
  sort: number;
  banner?: string;
}

export interface Property {
  id: string;
  title: string;
  subtitle?: string;
  type: 'APARTMENT' | 'HOUSE' | 'VILLA' | 'LOFT' | 'STUDIO' | 'CABIN';
  typeLabel?: string;
  cityId: string;
  address: string;
  lat?: number;
  lng?: number;
  bedrooms: number;
  beds: number;
  baths: number;
  maxGuests: number;
  area?: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  deposit: number;
  intro?: string;
  facilities: string[];
  houseRules?: string[];
  mainImage: string;
  images: string[];
  hostId: string;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  city?: City;
  host?: Host;
  isFavorite?: boolean;
}

export interface Booking {
  id: string;
  orderNo: string;
  userId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  deposit: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  guestName?: string;
  guestPhone?: string;
  specialRequest?: string;
  paidAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  property?: Pick<Property, 'id' | 'title' | 'mainImage' | 'address' | 'pricePerNight'> & {
    host?: Pick<Host, 'id' | 'realName'> & {
      user?: Pick<User, 'nickname' | 'avatar'>;
    };
  };
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  linkType?: string;
  sort: number;
}

export interface ActivityTopic {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  sort: number;
}

export interface SearchHistory {
  id: string;
  userId?: string;
  keyword: string;
  type: 'DESTINATION' | 'LOCATION' | 'KEYWORD';
  cityId?: string;
  checkIn?: string;
  checkOut?: string;
  createdAt: string;
  city?: City;
}

export interface DateSelection {
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export interface PriceDetails {
  roomCost: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  deposit: number;
  totalAmount: number;
}

export interface SearchParams {
  keyword?: string;
  cityId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  rating?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'rating' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface Pagination<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
