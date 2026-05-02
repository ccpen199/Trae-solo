export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar: string | null;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export enum UserRole {
  TOURIST = 'TOURIST',
  SALES = 'SALES',
  GUIDE = 'GUIDE',
  AGENCY = 'AGENCY',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TourStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TourGroupStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Tour {
  id: string;
  code: string;
  name: string;
  description: string | null;
  destination: string;
  days: number;
  nights: number;
  routeDetails: string | null;
  includeItems: string | null;
  excludeItems: string | null;
  notes: string | null;
  status: TourStatus;
  category: string | null;
  image: string | null;
  basePrice: number;
  childPrice: number;
  minGroupSize: number;
  maxGroupSize: number;
  creatorId: string;
  agencyId: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  creator?: User;
  groups?: TourGroup[];
  _count?: {
    groups: number;
  };
}

export interface TourGroup {
  id: string;
  tourId: string;
  code: string;
  startDate: string;
  endDate: string;
  price: number;
  childPrice: number;
  totalStock: number;
  soldStock: number;
  minGroupSize: number;
  maxGroupSize: number;
  status: TourGroupStatus;
  guideId: string | null;
  salesId: string | null;
  departurePoint: string | null;
  returnPoint: string | null;
  meetingTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  tour?: Tour;
  guide?: User;
  sales?: User;
  itineraryDays?: ItineraryDay[];
  orders?: Order[];
  passengerCount?: number;
  adultCount?: number;
  childCount?: number;
  _count?: {
    orders: number;
  };
}

export interface ItineraryDay {
  id: string;
  groupId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  hotel: string | null;
  transport: string | null;
  attractions: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  groupId: string;
  touristId: string;
  contactName: string;
  contactPhone: string;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentTime: string | null;
  adultCount: number;
  childCount: number;
  specialRequests: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  group?: TourGroup;
  tourist?: User;
  passengers?: Passenger[];
  contracts?: Contract[];
  insurance?: Insurance[];
  payments?: Payment[];
  _count?: {
    passengers: number;
  };
}

export interface Passenger {
  id: string;
  orderId: string;
  name: string;
  idType: string;
  idNumber: string;
  phone: string | null;
  isChild: boolean;
  birthDate: string | null;
  gender: string | null;
  specialNeeds: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  orderId: string;
  contractNo: string;
  version: string;
  content: string;
  signedAt: string | null;
  signedBy: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Insurance {
  id: string;
  orderId: string;
  insuranceNo: string;
  company: string;
  policyType: string;
  coverage: number;
  premium: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentNo: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripReport {
  id: string;
  groupId: string;
  reporterId: string;
  reportDate: string;
  dayNumber: number;
  title: string;
  content: string;
  weather: string | null;
  issues: string | null;
  touristStatus: string | null;
  attachments: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  reporter?: User;
}

export interface Settlement {
  id: string;
  settlementNo: string;
  groupId: string;
  tourId: string | null;
  agencyId: string | null;
  totalRevenue: number;
  totalCost: number;
  commission: number;
  profit: number;
  touristCount: number;
  status: SettlementStatus;
  completedAt: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  group?: TourGroup;
  tour?: Tour;
  costItems?: SettlementCost[];
}

export interface SettlementCost {
  id: string;
  settlementId: string;
  category: string;
  description: string;
  amount: number;
  payee: string | null;
  invoiceNo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessStatistics {
  totalRevenue: number;
  totalOrders: number;
  totalTourists: number;
  totalGroups: number;
  confirmedGroups: number;
  confirmationRate: string;
  topTours: Array<{
    tourId: string;
    tourCode: string;
    tourName: string;
    revenue: number;
    orders: number;
    groups: number;
  }>;
  period: string;
}

export interface InventoryStats {
  groupId: string;
  groupCode: string;
  status: TourGroupStatus;
  totalStock: number;
  soldStock: number;
  availableStock: number;
  totalBooked: number;
  paidPassengers: number;
  minGroupSize: number;
  maxGroupSize: number;
  isConfirmed: boolean;
  confirmationMessage?: string;
}

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  category?: 'personal' | 'contact' | 'emergency' | 'travel' | 'other';
  passengerType?: 'all' | 'adult' | 'child';
}

export interface FormTemplate {
  id?: string;
  tourId: string;
  name: string;
  fields: FormField[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  name: string;
  phone?: string;
  email?: string;
  role?: UserRole;
}

export interface LoginResult {
  user: User;
  token: string;
}

export interface TouristProfile {
  userId: string;
  orders: Order[];
  passengers: Passenger[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface GuideTask {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: TourGroupStatus;
  tour: Tour;
  passengerCount: number;
  adultCount: number;
  childCount: number;
}
