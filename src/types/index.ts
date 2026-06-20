export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'gold' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'completed'
  | 'returning'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'processing';

export interface StepItem {
  title: string;
  description?: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: string;
}

export type TimelineStatus = 'pending' | 'done' | 'error' | 'active';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: TimelineStatus;
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  role: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort?: number;
  avgPrice?: string;
  [key: string]: unknown;
}

export interface Model {
  id: string;
  name: string;
  brandId: string;
  startPrice: number;
  sGradeAvgPrice: number;
  thumbnail?: string;
  specs?: Record<string, string>;
  series?: string;
  basePrice?: number;
  [key: string]: unknown;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  categoryId: string;
  country?: string;
  models?: Model[];
  products?: number;
  initial?: string;
  [key: string]: unknown;
}

export interface InspectorCertificate {
  name: string;
  no: string;
  issueDate: string;
  expireDate: string;
  issuer: string;
}

export interface Inspector {
  id: string;
  name: string;
  avatar?: string;
  experience?: number;
  experienceYears?: number;
  region?: string;
  rating?: number;
  certifications?: string[] | InspectorCertificate[];
  deviationRate?: number[];
  specialties?: string[];
  deviationRate30d?: number;
  totalOrders?: number;
  flyCheckPassRate?: number;
  [key: string]: unknown;
}

export interface InspectorStats {
  deviationTrend: { date: string; rate: number }[];
  avgDeviation: number;
  industryAvg: number;
  flyCheckResults: { date: string; original: number; recheck: number; deviation: number }[];
}

export type DamageLevel = 1 | 2 | 3 | 4 | 5;
export type GradeLevel = 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C';

export interface AIAnalyzeResult {
  scratchLevel: DamageLevel | string;
  wearLevel: DamageLevel | string;
  oxidationLevel: DamageLevel | string;
  functionScore: number;
  overallGrade: GradeLevel | string;
  aiConfidence?: number;
  defectDetails?: { area: string; type: string; severity: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

export type PriceTier = 'instant' | 'standard' | 'consignment';

export interface PriceTierUI {
  id: string;
  tier: PriceTier;
  label: string;
  name: string;
  price: number;
  settlementDays: string;
  arrivalTime: string;
  description: string;
  features: string[];
}

export interface TieredPrice {
  tier: PriceTier;
  label: string;
  price: number;
  settlementDays: string;
  description: string;
}

export interface QuoteResult {
  tieredPrices: TieredPrice[];
  priceComparison: {
    platform: string;
    price: number;
    trend?: 'up' | 'down' | 'flat';
    trendPercent?: number;
    [key: string]: unknown;
  }[];
  priceHistory: { date: string; price: number }[];
  serialVerifyRule: any;
}

export interface ConditionOption {
  key: string;
  label: string;
  value?: string;
  description?: string;
}

export interface ConditionQuestion {
  id: string;
  key?: string;
  question: string;
  options: ConditionOption[];
}

export interface MarketTicker {
  brand: string;
  brandName?: string;
  model?: string;
  productName?: string;
  price: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down';
}

export interface LatestDeal {
  id: string;
  brand: string;
  brandName?: string;
  model?: string;
  productName?: string;
  grade: 'S' | 'A' | 'B' | 'C';
  price: number;
  initial: string;
  gradient: string;
  time?: string;
}

export type UserRole = 'customer' | 'inspector' | 'admin';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PagedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductModel {
  id: string;
  brandId: string;
  brandName?: string;
  name: string;
  series?: string;
  launchYear?: number;
  msrp?: number;
  category?: string;
  basePrice?: number;
  sPrice?: number;
  aPrice?: number;
  bPrice?: number;
  cPrice?: number;
  specs?: Record<string, any>;
  serialRule?: SerialRule;
  authenticityPoints?: string[];
  priceHistory?: { date: string; price: number }[];
  images?: string[];
  popular?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface SerialRule {
  id?: string;
  modelId?: string;
  pattern?: string;
  algo?: string;
  lookupUrl?: string;
  positions?: { pos: number; type: 'brand' | 'model' | 'year' | 'factory' | 'check'; meaning: string }[];
  example?: string;
  validationRegex?: string;
  [key: string]: unknown;
}

export type OverallGrade = GradeLevel;
export type OrderStatus =
  | 'pending_pickup'
  | 'inspecting'
  | 'pending_confirm'
  | 'paid'
  | 'completed'
  | 'returning'
  | 'returned'
  | 'cancelled';
export type PickupPeriod = 'morning' | 'afternoon' | 'evening';
export type ReturnStatus =
  | 'pending_pickup'
  | 'shipping'
  | 'inspecting'
  | 'refunding'
  | 'completed'
  | 'rejected'
  | 'requested'
  | 'reviewing'
  | 'approved'
  | 'shipped'
  | 'refunded';

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  userId: string;
  userName?: string;
  userPhone?: string;
  modelId?: string;
  productInfo: {
    modelId?: string;
    brand: string;
    model: string;
    image: string;
    grade: string;
    serialNumber?: string;
    [key: string]: unknown;
  };
  conditionAnswers?: Record<string, string>;
  aiResult?: AIAnalyzeResult;
  quotePrice: number;
  finalPrice?: number;
  selectedTier?: PriceTier;
  tieredPrice?: number;
  pickupAddress?: {
    province: string;
    city: string;
    district: string;
    detail: string;
    contact: string;
    phone: string;
    [key: string]: unknown;
  };
  pickupWindow?: {
    date: string;
    period: PickupPeriod;
    [key: string]: unknown;
  };
  inspectorId?: string;
  inspectorName?: string;
  inspectionReport?: InspectionReport;
  priceComparisonScreenshots?: string[];
  signedAgreement?: boolean;
  signature?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  ecoCertId?: string;
  [key: string]: unknown;
}

export interface InspectionReport {
  id: string;
  orderId: string;
  inspectorName: string;
  inspectorId: string;
  inspectTime?: string;
  inspectedAt?: string;
  serialNumber?: string;
  serialVerified?: boolean;
  grade?: OverallGrade;
  functionStatus?: Record<string, boolean>;
  appearancePhotos?: string[];
  defectMarkups?: { position: string; description: string; photo: string }[];
  testItems?: { name: string; result: string; note?: string }[];
  finalConclusion?: string;
  priceSuggestion?: number;
  signature?: string;
  images?: { label: string; url: string }[];
  aiAnalysis?: AIAnalyzeResult;
  testResults?: { category: string; items: { name: string; passed: boolean; note?: string }[] }[];
  items?: any[];
  finalPrice?: number;
  [key: string]: unknown;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  orderNo?: string;
  userId?: string;
  status: ReturnStatus;
  reason: string;
  description?: string;
  photos?: string[];
  refundMethod?: 'original' | 'bank';
  bankInfo?: { bank: string; account: string; holder: string };
  refundAmount?: number;
  timeline: { time: string; status: string; operator?: string; note?: string }[];
  estimatedRefundDate?: string;
  logistics?: { company: string; trackingNo: string; updatedAt?: string };
  createdAt?: string;
  completedAt?: string;
  [key: string]: unknown;
}

export type FlyCheckStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface FlyCheckTask {
  id: string;
  originalOrderId?: string;
  orderId?: string;
  orderNo?: string;
  originalInspector?: string;
  originalInspectorId?: string;
  inspectorId?: string;
  originalGrade?: string;
  originalPrice?: number;
  scheduledAt?: string;
  recheckInspector?: string;
  recheckInspectorId?: string;
  recheckGrade?: string;
  recheckPrice?: number;
  deviationPercent?: number;
  status: FlyCheckStatus;
  warning?: boolean;
  deviationAlert?: boolean;
  threshold?: number;
  warningLevel?: 'low' | 'medium' | 'high';
  priority?: 'normal' | 'urgent';
  findings?: { area: string; issue: string; severity: string }[];
  deviatedImages?: string[] | { area: string; issue: string; severity: string }[];
  notes?: string;
  createdAt?: string;
  assignedAt?: string;
  completedAt?: string;
  [key: string]: unknown;
}

export interface EcoMetrics {
  totalRecycled?: number;
  totalRecycledUnits?: number;
  totalCarbonSavedKg: number;
  totalWaterSavedL?: number;
  totalMaterialSavedKg?: number;
  totalMaterialSavedL?: number;
  equivalentTrees?: number;
  equivalentEnergy?: number;
  todayRecycled?: number;
  todayCarbonKg?: number;
  thisMonthUnits?: any;
  thisMonthCarbonKg?: any;
  trend?: any;
  categoryBreakdown?: { category: string; count: number; carbonKg: number }[];
  monthlyTrend?: { month: string; carbonKg: number; recycled: number }[];
  userRank?: { percentile: number; badge: string };
  [key: string]: unknown;
}

export interface EcoCertificate {
  id: string;
  orderId: string;
  orderNo?: string;
  userId?: string;
  category?: string;
  productName: string;
  productCategory?: string;
  originalPrice?: number;
  carbonSavedKg: number;
  waterSavedL?: number;
  materialSavedKg?: number;
  issuedAt?: string;
  issueDate?: string;
  certNo: string;
  equivalentTrees?: number;
  userName?: string;
  userHash?: string;
  qrCode: string;
  template?: 'standard' | 'premium';
  blockchainTx?: string;
  [key: string]: unknown;
}

export interface InventoryOverview {
  totalInStock?: number;
  totalSKU?: number;
  totalValue?: number;
  avgStockDays?: number;
  refurbishmentRate?: number;
  monthlyProfit?: number;
  gmv?: number;
  sellThroughRate?: number;
  monthlyProfitTrend?: { month: string; profit: number; gmv: number }[];
  channelProfit?: ChannelProfit[];
  stockAgeDistribution?: AgeDistribution[];
  slowMovingItems?: SlowMovingItem[];
  categoryHealth?: { category: string; inStock: number; avgDays: number; health: 'good' | 'warn' | 'danger' }[];
  [key: string]: unknown;
}

export interface ChannelProfit {
  channel: string;
  count: number;
  profit: number;
  margin: number;
  units?: number;
  [key: string]: unknown;
}

export interface SlowMovingItem {
  product?: string;
  productName?: string;
  productId: string;
  sku: string;
  days: number;
  cost: number;
  suggestion: string;
  category: string;
  [key: string]: unknown;
}

export interface AgeDistribution {
  range: string;
  count: number;
  percentage: number;
  value: number;
  units?: number;
  [key: string]: unknown;
}

export interface AdminDashboard {
  totalOrders?: number;
  todayOrders?: number;
  todayRevenue?: number;
  pendingOrders?: number;
  pendingPickup?: number;
  inspecting?: number;
  activeInspectors?: number;
  totalInspectors?: number;
  totalRevenue?: number;
  avgOrderValue?: number;
  avgDeviationRate?: number;
  averageDeviationRate?: number;
  carbonSavedKg?: number;
  carbonSavedThisMonth?: number;
  inventoryValue?: number;
  weeklyRevenue?: { day: string; revenue: number }[];
  ordersByStatus?: { status: OrderStatus; count: number }[];
  orderStatusDistribution?: { status: OrderStatus; count: number }[];
  revenueTrend?: { date: string; revenue: number; orders: number }[];
  topBrands?: { brand: string; count: number; revenue: number }[];
  categoryDistribution?: { category: string; count: number }[];
  cityCoverage?: { cities: number; districts: number };
  recentOrders?: Order[];
  alertOrders?: { orderId: string; issue: string; level: 'info' | 'warn' | 'danger' }[];
  [key: string]: unknown;
}
