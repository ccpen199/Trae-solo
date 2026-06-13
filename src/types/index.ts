export type PropertyType = '写字楼' | '商铺' | '厂房' | '产业园' | '综合体';
export type PropertyStatus = '待出租' | '出租中' | '已租出' | '装修中' | '维护中';
export type FireInspectionStatus = '已通过' | '待验收' | '整改中' | '未申请';
export type OwnershipType = '国有产权' | '集体产权' | '私有产权' | '股份制' | '其他';

export interface PropertyLocation {
  province: string;
  city: string;
  district: string;
  address: string;
  floor: string;
  totalFloors: number;
}

export interface PropertySpec {
  area: number;
  usableArea: number;
  ceilingHeight: number;
  loadCapacity: number;
  columnSpacing: string;
  windowRatio: string;
}

export interface RentClause {
  monthlyRent: number;
  rentUnit: '元/㎡·天' | '元/㎡·月';
  rentIncreaseRate: number;
  depositMonths: number;
  freeRentDays: number;
  minLeaseTerm: number;
  maxLeaseTerm: number;
  paymentMethod: '押一付一' | '押一付三' | '押二付三' | '押三付一';
}

export interface PropertyOwnership {
  type: OwnershipType;
  certificateNumber: string;
  ownerName: string;
  ownershipExpireDate: string;
  fireInspectionStatus: FireInspectionStatus;
  fireInspectionDate?: string;
  hasElevator: boolean;
  hasParking: boolean;
  parkingSpots: number;
}

export interface PropertyImage {
  id: string;
  type: 'thumbnail' | 'vr' | 'interior' | 'exterior' | 'floorplan';
  url: string;
  name: string;
  isVr?: boolean;
  vrScenes?: string[];
}

export interface Property {
  id: string;
  name: string;
  code: string;
  type: PropertyType;
  status: PropertyStatus;
  location: PropertyLocation;
  spec: PropertySpec;
  rentClause: RentClause;
  ownership: PropertyOwnership;
  images: PropertyImage[];
  tags: string[];
  description: string;
  totalViews: number;
  vrViews: number;
  intentionCount: number;
  publishDate: string;
  lastUpdateDate: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
}

export type WorkOrderStatus = '需求诊断' | '方案报价' | '施工排期' | '材料进场' | '施工执行' | '竣工验收' | '质保跟踪';
export type WorkOrderPriority = '紧急' | '高' | '中' | '低';
export type BudgetLevel = '经济型' | '标准型' | '品质型' | '豪华型';
export type DesignStyle = '现代简约' | '新中式' | '工业风' | '北欧风' | '商务轻奢' | '科技感' | '复古风' | '自然生态';

export interface DemandDiagnosis {
  area: number;
  budgetRange: [number, number];
  duration: number;
  staffCount: number;
  meetingRoomCount: number;
  receptionArea: boolean;
  pantry: boolean;
  serverRoom: boolean;
  soundproofRoom: boolean;
  greening: boolean;
  designStyles: DesignStyle[];
  colorPreference: string[];
  lightingRequirement: '明亮通透' | '温馨柔和' | '专业办公' | '创意多变';
  specialRequirements: string;
  questionnaireFilledAt: string;
}

export interface QuotationItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  remark?: string;
}

export interface Quotation {
  id: string;
  planName: string;
  totalPrice: number;
  items: QuotationItem[];
  totalMaterials: number;
  totalLabor: number;
  totalManagement: number;
  totalDesign: number;
  discount: number;
  finalPrice: number;
  validUntil: string;
  attachments: { id: string; name: string; url: string }[];
  submittedAt: string;
  providerId: string;
  providerName: string;
  selected?: boolean;
}

export interface ScheduleTask {
  id: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  assignee: string;
  assigneePhone: string;
  dependencies: string[];
  milestone: boolean;
  status: '未开始' | '进行中' | '已完成' | '逾期';
  remark?: string;
}

export interface MaterialItem {
  id: string;
  category: string;
  name: string;
  specification: string;
  brand: string;
  quantity: number;
  unit: string;
  expectedArrivalDate: string;
  actualArrivalDate?: string;
  qualityStatus: '待验收' | '合格' | '不合格' | '部分合格';
  inspector?: string;
  inspectionDate?: string;
  inspectionPhotos: string[];
  signedBy?: string;
  signedAt?: string;
  remark?: string;
}

export interface AcceptanceItem {
  id: string;
  category: string;
  name: string;
  standard: string;
  result: '合格' | '不合格' | '待整改';
  defectDescription?: string;
  rectificationDeadline?: string;
  rectificationStatus?: '未整改' | '整改中' | '已整改';
  rectificationPhotos: string[];
  inspector: string;
  inspectionDate: string;
}

export interface AcceptanceRecord {
  id: string;
  items: AcceptanceItem[];
  totalQualified: number;
  totalUnqualified: number;
  overallResult: '通过' | '待整改后验收' | '不通过';
  npsScore?: number;
  signatureUrl?: string;
  signedAt?: string;
  signedBy?: string;
  rectificationPlan?: string;
  rectificationPhotos: string[];
  finalAcceptanceDate?: string;
}

export interface BimModel {
  id: string;
  name: string;
  version: string;
  size: string;
  uploadDate: string;
  layers: { id: string; name: string; visible: boolean }[];
  changes: {
    id: string;
    version: string;
    description: string;
    date: string;
    author: string;
  }[];
  modelUrl: string;
  viewUrl: string;
}

export interface WorkOrderTimeline {
  node: WorkOrderStatus;
  status: '未开始' | '进行中' | '已完成' | '逾期';
  startAt?: string;
  completedAt?: string;
  operatorName?: string;
  remark?: string;
  isOverdue?: boolean;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  propertyId: string;
  propertyName: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  budgetLevel: BudgetLevel;
  demand: DemandDiagnosis;
  quotations: Quotation[];
  selectedQuotationId?: string;
  schedule: ScheduleTask[];
  materials: MaterialItem[];
  acceptance?: AcceptanceRecord;
  bimModels: BimModel[];
  timeline: WorkOrderTimeline[];
  initiatorId: string;
  initiatorName: string;
  initiatorPhone: string;
  initiatorRole: '业主' | '租户';
  providerId?: string;
  providerName?: string;
  contractId?: string;
  totalBudget: number;
  actualCost?: number;
  expectedStartDate: string;
  expectedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  overdueWarning: boolean;
  createTime: string;
  updateTime: string;
}

export type ProviderLevel = 'S级' | 'A级' | 'B级' | 'C级';
export type ProviderStatus = '认证中' | '已认证' | '已冻结' | '已过期';

export interface Qualification {
  id: string;
  name: string;
  level: string;
  certificateNo: string;
  issueDate: string;
  expireDate: string;
  issuingAuthority: string;
  imageUrl: string;
}

export interface CaseProject {
  id: string;
  name: string;
  propertyType: PropertyType;
  area: number;
  budget: number;
  duration: number;
  completionDate: string;
  ownerName: string;
  description: string;
  tags: string[];
  coverUrl: string;
  images: string[];
  npsScore: number;
}

export interface ProviderRating {
  overall: number;
  deliveryQuality: number;
  responseSpeed: number;
  costPerformance: number;
  designLevel: number;
  afterSales: number;
  totalReviews: number;
  totalOrders: number;
  onTimeRate: number;
}

export interface Provider {
  id: string;
  companyName: string;
  shortName: string;
  unifiedCreditCode: string;
  legalPerson: string;
  registerDate: string;
  registerCapital: string;
  level: ProviderLevel;
  status: ProviderStatus;
  certificationDate: string;
  expireDate: string;
  specialities: string[];
  businessScope: string[];
  minArea: number;
  maxArea: number;
  minBudget: number;
  maxBudget: number;
  provinces: string[];
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  logoUrl: string;
  bannerUrl: string;
  introduction: string;
  qualifications: Qualification[];
  cases: CaseProject[];
  teamSize: number;
  designers: number;
  projectManagers: number;
  workers: number;
  rating: ProviderRating;
  averageQuotationCycle: number;
  averageCompletionRate: number;
  createTime: string;
  updateTime: string;
}

export interface MatchCriteria {
  area: number;
  budgetRange: [number, number];
  duration: number;
  designStyles: DesignStyle[];
  propertyType: PropertyType;
  city: string;
  specialRequirements?: string;
}

export interface MatchScore {
  overall: number;
  areaMatch: number;
  budgetMatch: number;
  durationMatch: number;
  styleMatch: number;
  locationMatch: number;
  qualificationMatch: number;
  caseMatch: number;
}

export interface MatchResult {
  id: string;
  providerId: string;
  provider: Provider;
  matchScore: MatchScore;
  matchLevel: '完美匹配' | '高度匹配' | '较好匹配' | '一般匹配';
  recommendedReason: string[];
  potentialRisk?: string[];
  estimatedQuotation?: [number, number];
  estimatedDuration?: number;
  availableTeam: {
    designers: number;
    projectManagers: number;
    workers: number;
  };
  inviteStatus: '未邀请' | '已邀请' | '已响应' | '已拒绝';
  matchedAt: string;
}

export type NegotiationStatus = '进行中' | '达成一致' | '已中止' | '已超时';

export interface NegotiationRecord {
  id: string;
  type: '报价' | '还价' | '备注' | '系统消息';
  senderId: string;
  senderName: string;
  senderRole: '业主' | '租户' | '供应商' | '系统';
  price?: number;
  message: string;
  timestamp: string;
  attachment?: { name: string; url: string };
}

export interface Negotiation {
  id: string;
  workOrderId: string;
  workOrderTitle: string;
  propertyName: string;
  providerId: string;
  providerName: string;
  initiatorId: string;
  initiatorName: string;
  initiatorRole: '业主' | '租户';
  status: NegotiationStatus;
  initialPrice: number;
  currentPrice: number;
  agreedPrice?: number;
  priceHistory: { date: string; price: number; party: '需求方' | '供应方' }[];
  records: NegotiationRecord[];
  validUntil: string;
  createdAt: string;
  lastUpdateAt: string;
  agreementReachedAt?: string;
}

export type ContractStatus = '待签署' | '签署中' | '已签署' | '执行中' | '已完成' | '已变更' | '已终止';
export type ContractType = '装修施工合同' | '设计合同' | '材料采购合同' | '全包合同';

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  isHighlight: boolean;
  isEditable: boolean;
}

export interface PaymentTerm {
  id: string;
  milestone: string;
  percentage: number;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  status: '未支付' | '已支付' | '支付中' | '逾期';
}

export interface PartyInfo {
  type: '甲方' | '乙方';
  companyName: string;
  legalPerson: string;
  contactName: string;
  contactPhone: string;
  address: string;
  bankAccount?: string;
  taxNumber?: string;
  signatureUrl?: string;
  signedAt?: string;
  signStatus: '未签署' | '已签署';
}

export interface ChangeRecord {
  id: string;
  version: string;
  changeItems: string;
  changeReason: string;
  amountChange: number;
  date: string;
  operator: string;
  bothAgreed: boolean;
}

export interface Contract {
  id: string;
  contractNo: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  version: string;
  workOrderId: string;
  workOrderTitle: string;
  propertyId: string;
  propertyName: string;
  partyA: PartyInfo;
  partyB: PartyInfo;
  totalAmount: number;
  currency: string;
  signDate?: string;
  effectiveDate?: string;
  expireDate?: string;
  clauses: ContractClause[];
  paymentTerms: PaymentTerm[];
  attachmentUrls: string[];
  changeRecords: ChangeRecord[];
  warrantyPeriod: string;
  penaltyClause: string;
  disputeResolution: string;
  createdAt: string;
  updateAt: string;
  createdBy: string;
}

export type NpsCategory = '整体体验' | '设计质量' | '施工质量' | '响应速度' | '性价比' | '售后服务';

export interface NpsDimension {
  category: NpsCategory;
  score: number;
  weight: number;
}

export interface NpsBadReview {
  id: string;
  keywords: string[];
  count: number;
  category: NpsCategory;
  trend: number;
}

export interface NpsTrend {
  date: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

export interface NpsRecord {
  id: string;
  workOrderId: string;
  workOrderTitle: string;
  propertyName: string;
  providerId: string;
  providerName: string;
  score: number;
  classification: '推荐者' | '中立者' | '贬损者';
  dimensions: NpsDimension[];
  advantages: string[];
  improvements: string[];
  comment: string;
  photos: string[];
  reviewerId: string;
  reviewerName: string;
  reviewerRole: '业主' | '租户';
  reviewDate: string;
  responseStatus: '未回复' | '已回复' | '已处理';
  responseContent?: string;
  responseBy?: string;
  responseDate?: string;
}

export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalWorkOrders: number;
  activeWorkOrders: number;
  pendingContracts: number;
  totalRevenue: number;
  monthRevenue: number;
  revenueGrowth: number;
  totalProviders: number;
  activeProviders: number;
  matchSuccessRate: number;
  averageNps: number;
  averageDuration: number;
  durationOptimization: number;
  averageCostSaving: number;
}

export interface TrendData {
  date: string;
  value: number;
  [key: string]: number | string;
}

export interface TodoItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: '待处理' | '进行中' | '已完成';
  deadline: string;
  relatedId: string;
  relatedType: 'workOrder' | 'contract' | 'provider' | 'property' | 'negotiation';
  createTime: string;
}
