export type Category = 'clothing' | 'books' | 'phones';

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'picked'
  | 'inspecting'
  | 'priced'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'cancelled';

export type QualityOrderStatus = 'pending' | 'ai-screening' | 'manual-inspection' | 'completed';

export type PayoutStatus = 'pending' | 'processing' | 'success' | 'failed';

export type PayoutMethod = 'wechat_wallet' | 'bank_card';

export type CourierStatus = 'online' | 'offline' | 'busy';

export type LogisticsProvider = 'sf' | 'jd';

export type LogisticsStatus = 'created' | 'picked' | 'transit' | 'delivered';

export type ProcessorStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type PricingOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';

export type PricingFormulaType = 'fixed' | 'per_kg' | 'per_item' | 'percentage';

export type PricingField = 'weight' | 'condition' | 'brand' | 'model' | 'quantity';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  wechatOpenId?: string;
  totalRecycledKg: number;
  carbonSavedKg: number;
  donationCount: number;
}

export interface Address {
  id: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  contactName: string;
  contactPhone: string;
  isDefault?: boolean;
}

export interface TimeWindow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  condition: number;
  estimatedPrice: number;
  finalPrice?: number;
  images?: string[];
  brand?: string;
  model?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  time: string;
  description: string;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  category: Category;
  items: OrderItem[];
  estimatedPrice: number;
  finalPrice?: number;
  status: OrderStatus;
  pickupTime: string;
  address: Address;
  courierId?: string;
  createdAt: string;
  timeline: OrderTimeline[];
  weightKg?: number;
}

export interface AiInspectionResult {
  categoryConfidence: number;
  detectedCondition: number;
  defects: string[];
  confidence: number;
}

export interface ManualInspectionResult {
  inspector: string;
  condition: number;
  actualWeightKg: number;
  defects: string[];
  notes: string;
  images: string[];
}

export interface SopStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface QualityOrder {
  id: string;
  orderId: string;
  status: QualityOrderStatus;
  aiResult?: AiInspectionResult;
  manualResult?: ManualInspectionResult;
  images: string[];
  sopSteps: SopStep[];
  assignee?: string;
  createdAt: string;
}

export interface PricingCondition {
  field: PricingField;
  operator: PricingOperator;
  value: unknown;
}

export interface PricingFormula {
  type: PricingFormulaType;
  basePrice: number;
  multipliers: { field: string; factor: number }[];
}

export interface PricingRule {
  id: string;
  name: string;
  category: Category | 'all';
  priority: number;
  enabled: boolean;
  conditions: PricingCondition[];
  formula: PricingFormula;
}

export interface AccountInfo {
  type: 'wechat' | 'bank';
  accountNumber: string;
  accountName: string;
  bankName?: string;
}

export interface Payout {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  accountInfo: AccountInfo;
  transactionId?: string;
  createdAt: string;
  paidAt?: string;
  remark?: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  status: CourierStatus;
  serviceArea: string;
  rating: number;
  orderCount: number;
  currentLocation?: { lat: number; lng: number };
}

export interface TrackingEvent {
  time: string;
  status: string;
  description: string;
  location?: string;
}

export interface LogisticsOrder {
  id: string;
  orderId: string;
  courierId: string;
  provider: LogisticsProvider;
  trackingNo: string;
  status: LogisticsStatus;
  trackingEvents: TrackingEvent[];
}

export interface ReviewRecord {
  id: string;
  status: ReviewStatus;
  reviewer: string;
  comment: string;
  createdAt: string;
}

export interface Processor {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  status: ProcessorStatus;
  licenseNo: string;
  licenseImages: string[];
  capacity: string;
  categories: string[];
  rating: number;
  reviewHistory: ReviewRecord[];
  address?: string;
}

export interface MaterialTrace {
  id: string;
  orderId: string;
  processorId: string;
  batchNo: string;
  weightKg: number;
  status: string;
  receivedAt: string;
  processNote?: string;
}

export interface DonationFlow {
  id: string;
  orderId: string;
  amount: number;
  beneficiary: string;
  projectName: string;
  certificateUrl?: string;
  donatedAt: string;
  description: string;
}

export interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalRecycledKg: number;
    totalPayout: number;
    activeUsers: number;
    pendingQualityOrders: number;
    pendingPayouts: number;
  };
  orderTrend: { date: string; count: number; kg: number }[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  userFrequency: { range: string; count: number }[];
  regionDistribution: { region: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
}

export interface EstimateRequest {
  category: Category;
  brand?: string;
  model?: string;
  condition: number;
  weightKg?: number;
  quantity?: number;
}

export interface EstimateResult {
  minPrice: number;
  maxPrice: number;
  unitPrice: number;
  breakdown: { item: string; value: number }[];
}

export interface BookingInfo {
  category: Category | null;
  brand?: string;
  model?: string;
  condition: number;
  weightKg?: number;
  quantity?: number;
  estimatedPrice?: number;
  selectedTimeWindow?: TimeWindow;
  selectedAddress?: Address;
}

export interface BrandItem {
  id: string;
  name: string;
  logo?: string;
  category: Category;
}

export interface NavigationState {
  currentPage: string;
  sidebarCollapsed: boolean;
  activeTab: string;
}

export interface AppStore {
  currentUser: User | null;
  bookingInfo: BookingInfo;
  orders: Order[];
  currentOrder: Order | null;
  qualityOrders: QualityOrder[];
  pricingRules: PricingRule[];
  payouts: Payout[];
  couriers: Courier[];
  processors: Processor[];
  materialTraces: MaterialTrace[];
  donationFlows: DonationFlow[];
  analytics: AnalyticsData | null;
  brands: BrandItem[];
  addresses: Address[];
  timeWindows: TimeWindow[];
  navigation: NavigationState;

  setCurrentUser: (user: User | null) => void;
  updateBookingInfo: (info: Partial<BookingInfo>) => void;
  resetBookingInfo: () => void;

  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  setCurrentOrder: (order: Order | null) => void;

  setQualityOrders: (orders: QualityOrder[]) => void;
  addQualityOrder: (order: QualityOrder) => void;
  updateQualityOrder: (id: string, updates: Partial<QualityOrder>) => void;

  setPricingRules: (rules: PricingRule[]) => void;
  addPricingRule: (rule: PricingRule) => void;
  updatePricingRule: (id: string, updates: Partial<PricingRule>) => void;
  deletePricingRule: (id: string) => void;

  setPayouts: (payouts: Payout[]) => void;
  updatePayout: (id: string, updates: Partial<Payout>) => void;

  setCouriers: (couriers: Courier[]) => void;
  addCourier: (courier: Courier) => void;
  updateCourier: (id: string, updates: Partial<Courier>) => void;

  setProcessors: (processors: Processor[]) => void;
  addProcessor: (processor: Processor) => void;
  updateProcessor: (id: string, updates: Partial<Processor>) => void;

  setAnalytics: (data: AnalyticsData | null) => void;
  setNavigation: (nav: Partial<NavigationState>) => void;
}
