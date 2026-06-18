export type UserRole = 'sales' | 'store_owner' | 'operator' | 'admin';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  realName: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  parentId?: number;
  storeId?: number;
  region?: string;
  level?: number;
  status: 'active' | 'inactive' | 'frozen';
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  level: 'potential' | 'regular' | 'vip';
  source: string;
  salesId: number;
  tags: string[];
  totalPurchases: number;
  lastPurchaseAt?: string;
  createdAt: string;
}

export interface CustomerRelationNode {
  id: number;
  name: string;
  type: 'sales' | 'customer' | 'referrer';
  level: number;
  value: number;
}

export interface CustomerRelationLink {
  source: number;
  target: number;
  relation: 'introduce' | 'purchase' | 'refer';
}

export interface CustomerGraph {
  nodes: CustomerRelationNode[];
  links: CustomerRelationLink[];
}

export interface Product {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  originalPrice: number;
  description: string;
  imageUrl?: string;
  specs: Record<string, string>;
  status: 'active' | 'inactive';
  stock?: number;
  batchNumber?: string;
  spec?: string;
}

export interface ProductBatch {
  id: number;
  productId: number;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
}

export interface TraceRecord {
  id: number;
  batchNo: string;
  action: string;
  operator: string;
  location: string;
  timestamp: string;
  txHash?: string;
}

export interface Inventory {
  id: number;
  productId: number;
  productName?: string;
  batchNo: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  availableQuantity: number;
  lastSyncAt: string;
  warehouse?: string;
  stock?: number;
  minStock?: number;
  price?: number;
  sku?: string;
}

export interface PromotionRule {
  conditionType: 'amount' | 'quantity' | 'product';
  conditionValue: number;
  discountType: 'percent' | 'fixed' | 'points';
  discountValue: number;
}

export interface Promotion {
  id: number;
  name: string;
  type: 'discount' | 'coupon' | 'bundle' | 'points';
  rules: PromotionRule[];
  startTime: string;
  endTime: string;
  status: 'draft' | 'active' | 'ended' | 'paused';
  usedCount?: number;
  totalCount?: number;
  totalDiscount?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  discountValue?: number;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ownerId: number;
  ownerName?: string;
  phone: string;
  businessHours: string;
  services: string[];
  rating: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  type?: string;
  reviewCount?: number;
}

export interface Appointment {
  id: number;
  customerId: number;
  customerName: string;
  storeId: number;
  storeName: string;
  salesId: number;
  serviceType: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';
  remark?: string;
  createdAt: string;
  appointmentDate?: string;
  customerPhone?: string;
  storeAddress?: string;
}

export interface ServiceRecord {
  id: number;
  appointmentId?: number;
  customerId: number;
  customerName?: string;
  storeId: number;
  storeName?: string;
  serviceItems: string[];
  startTime: string;
  endTime: string;
  operator: string;
  notes?: string;
  onChain: boolean;
  txHash?: string;
  createdAt: string;
  isOnChain?: boolean;
  serviceType?: string;
  serviceDate?: string;
  duration?: number;
  serviceContent?: string;
  result?: string;
  feedback?: string;
  blockHeight?: number;
  chainTimestamp?: string;
  transactionHash?: string;
  dataHash?: string;
}

export interface Review {
  id: number;
  serviceRecordId: number;
  customerId: number;
  customerName: string;
  storeId: number;
  rating: number;
  content: string;
  reply?: string;
  createdAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  hasReplied?: boolean;
  storeName?: string;
  serviceType?: string;
  images?: string[];
  replyAt?: string;
}

export type AlertType = 'speech' | 'withdraw' | 'geofence' | 'abnormal' | 'sensitive_speech' | 'geo_fence' | 'abnormal_behavior';
export type AlertLevel = 'low' | 'medium' | 'high';
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export interface RiskAlert {
  id: number;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  userId: number;
  userName: string;
  status: AlertStatus;
  createdAt: string;
  handledBy?: number;
  handledAt?: string;
  handlingNotes?: string;
}

export interface SpeechLog {
  id: number;
  conversationId: string;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  sensitiveWords: string[];
  riskScore: number;
  auditStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface WithdrawRequest {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  bankInfo: string;
  riskLevel: 'normal' | 'warning' | 'high_risk';
  riskReasons: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  auditedBy?: number;
  auditedAt?: string;
  auditNotes?: string;
}

export interface GeoFence {
  id: number;
  name: string;
  region: string;
  coordinates: Array<{ lat: number; lng: number }>;
  allowedRoles: UserRole[];
  isActive: boolean;
  type?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  pointCount?: number;
}

export interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  contentType: 'video' | 'document' | 'audio';
  contentUrl: string;
  duration: number;
  publishedBy: string;
  publishTime: string;
  viewCount: number;
  coverUrl?: string;
  progress?: number;
  rating?: number;
  studentCount?: number;
  type?: string;
}

export interface ExamQuestion {
  id: number;
  type: 'single' | 'multiple' | 'judge';
  question: string;
  options: string[];
  answer: number | number[] | boolean;
  score: number;
  options_json?: string;
  answer_json?: string;
}

export interface Exam {
  id: number;
  title: string;
  courseId?: number;
  duration: number;
  totalScore: number;
  passingScore: number;
  questionCount: number;
  questions?: ExamQuestion[];
  status?: 'not_started' | 'in_progress' | 'completed';
  difficulty?: 'easy' | 'medium' | 'hard';
  description?: string;
  deadline?: string;
  userScore?: number;
}

export interface ExamSubmission {
  id: number;
  examId: number;
  userId: number;
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface SpeechReview {
  id: number;
  conversationId: string;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  sensitiveWords: string[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  auditNotes?: string;
  userName?: string;
  source?: string;
  matchedWords?: string[];
}

export interface WithdrawReview {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  bankInfo: string;
  riskLevel: 'normal' | 'warning' | 'high_risk' | 'low' | 'medium' | 'high';
  riskReasons: string[];
  riskScore: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  auditedBy?: number;
  auditedAt?: string;
  auditNotes?: string;
  userRole?: string;
  bankName?: string;
  bankAccountLast4?: string;
  historyCount?: number;
  historyAmount?: number;
}

export interface ProductTraceNode {
  id: string;
  name: string;
  status: string;
  location: string;
  timestamp: string;
  operator: string;
  txHash?: string;
  isOnChain: boolean;
  step?: number;
  description?: string;
  details?: string;
  hash?: string;
}

export type InventoryItem = Inventory;

export interface SalesAnalysisData {
  trend: Array<{ date: string; sales: number; orders: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  topProducts: Array<{ rank: number; name: string; sales: number; growth: number }>;
  salesRate: number;
  slowMovingProducts: number;
  totalInventoryValue: number;
  dailyData?: Array<{ date: string; sales: number; orders: number }>;
  totalSales?: number;
  totalOrders?: number;
  growthRate?: number;
  activeProducts?: number;
}

export interface RankingItem {
  rank: number;
  userId: number;
  userName: string;
  avatar?: string;
  region: string;
  salesAmount: number;
  teamSize: number;
  growthRate: number;
  score: number;
  completionRate: number;
  id?: number;
  level?: string;
  teamName?: string;
  trend?: number;
  memberCount?: number;
}

export interface TeamFissionNode {
  id: number;
  name: string;
  role: string;
  level: number;
  salesAmount: number;
  teamSize: number;
  children: TeamFissionNode[];
  sales?: number;
  warning?: string;
  newMembers?: number;
  levelTitle?: string;
}

export interface SalesTrendData {
  date: string;
  salesAmount: number;
  orderCount: number;
  customerCount: number;
  sales?: number;
  orders?: number;
  growth?: number;
}

export interface MarketSaturationData {
  regions: Array<{
    name: string;
    value: number;
    saturation: number;
    potential: number;
  }>;
  highPotential: Array<{ name: string; saturation: number; potential: number }>;
  warnings: Array<{ name: string; saturation: number; suggestion: string }>;
}

export type MarketSaturationItem = {
  region: string;
  population: number;
  dealerCount: number;
  saturationRate: number;
  potentialScore: number;
};

export interface DashboardOverview {
  todaySales: number;
  monthSales: number;
  totalCustomers: number;
  activeSales: number;
  pendingApprovals: number;
  riskAlerts: number;
  salesTrend: SalesTrendData[];
  topProducts: Array<{ name: string; amount: number }>;
}

export interface ShareMaterial {
  id: number;
  title: string;
  type: 'image' | 'video' | 'article' | 'poster';
  category: string;
  thumbnailUrl: string;
  fileUrl: string;
  description: string;
  viewCount: number;
  shareCount: number;
}

export interface ShareLink {
  id: number;
  userId: number;
  originalUrl: string;
  shortCode: string;
  materialType?: string;
  viewCount: number;
  conversionCount: number;
  createdAt: string;
}

export interface ShareStatistics {
  totalShares: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  topMaterials: Array<{ name: string; views: number; conversions: number }>;
  dailyData: Array<{ date: string; shares: number; views: number }>;
}

export interface PersonalQRCode {
  code: string;
  url: string;
  expireAt: string;
  type: 'personal' | 'product' | 'store';
}
