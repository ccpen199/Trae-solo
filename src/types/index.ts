export type UserRole = 'owner' | 'provider' | 'designer' | 'expert' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export interface QualificationDoc {
  id: string;
  type: 'business_license' | 'qualification_cert' | 'safety_permit' | 'other';
  imageUrl: string;
  ocrResult?: Record<string, string>;
  verifiedAt?: string;
}

export interface HistoricalProject {
  id: string;
  name: string;
  area: number;
  price: number;
  style: DesignStyle;
  imageUrl: string;
  completedAt: string;
}

export interface InspectionReport {
  id: string;
  stage: string;
  inspector: string;
  score: number;
  issues: string[];
  images: string[];
  inspectedAt: string;
}

export interface DecorationCompany {
  id: string;
  name: string;
  logo?: string;
  qualificationLevel: 'level1' | 'level2' | 'level3';
  licenseNumber: string;
  establishedYear: number;
  caseCount: number;
  averageRating: number;
  reviewCount: number;
  city: string;
  serviceScope: string[];
  tags: string[];
  auditStatus: 'pending' | 'approved' | 'rejected';
  qualificationDocs: QualificationDoc[];
  historicalProjects: HistoricalProject[];
  inspectionReports: InspectionReport[];
}

export type DesignStyle = 'modern' | 'nordic' | 'chinese' | 'luxury' | 'industrial' | 'japanese' | 'mediterranean';

export interface Opening {
  type: 'door' | 'window';
  width: number;
  height: number;
  offsetFromLeft: number;
}

export interface WallConfig {
  id: string;
  position: 'north' | 'south' | 'east' | 'west';
  width: number;
  openings: Opening[];
}

export interface RoomConfig {
  id: string;
  type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'dining';
  name: string;
  width: number;
  length: number;
  height: number;
  walls: WallConfig[];
}

export interface FurnitureItem {
  id: string;
  category: 'sofa' | 'bed' | 'table' | 'chair' | 'cabinet' | 'tv' | 'lamp' | 'decoration';
  modelUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  materialId?: string;
}

export interface DesignPlan3D {
  id: string;
  name: string;
  ownerId: string;
  floorPlanUrl?: string;
  rooms: RoomConfig[];
  style: DesignStyle;
  budgetTier: 'economy' | 'quality' | 'luxury';
  totalBudget: number;
  furnitureItems: FurnitureItem[];
  createdAt: string;
}

export interface QuoteItem {
  category: 'main_material' | 'aux_material' | 'labor' | 'design' | 'management';
  subCategory: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  brand?: string;
  spec?: string;
  remark?: string;
}

export interface DecorationQuote {
  id: string;
  planName: string;
  city: string;
  area: number;
  houseType: string;
  craftLevel: 'basic' | 'standard' | 'premium';
  tier: 'economy' | 'quality' | 'luxury';
  items: QuoteItem[];
  totalPrice: number;
  mainMaterialTotal: number;
  auxMaterialTotal: number;
  laborTotal: number;
  designTotal: number;
  managementTotal: number;
  generatedAt: string;
}

export interface MeasurementRecord {
  area: number;
  rooms: RoomConfig[];
  photos: string[];
  notes: string;
  measuredBy: string;
  measuredAt: string;
}

export interface MeasurementAppointment {
  id: string;
  ownerId: string;
  companyId: string;
  address: string;
  contactName: string;
  contactPhone: string;
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  remark?: string;
  record?: MeasurementRecord;
}

export interface MaterialItem {
  name: string;
  brand: string;
  spec: string;
  quantity: number;
  unitPrice: number;
}

export interface WarrantyTerm {
  item: string;
  durationMonths: number;
  description: string;
}

export interface ComparisonPlan {
  id: string;
  companyId: string;
  companyName: string;
  planName: string;
  totalPrice: number;
  constructionPeriod: number;
  materials: MaterialItem[];
  warrantyTerms: WarrantyTerm[];
  highlights: string[];
}

export interface StandardRef {
  type: 'GB' | 'HB' | 'JGJ';
  code: string;
  article: string;
  content: string;
}

export interface ProcessStep {
  order: number;
  title: string;
  description: string;
  keyPoints: string[];
  imageUrl?: string;
}

export interface ConstructionProcess {
  id: string;
  stage: 'water_electric' | 'masonry' | 'carpentry' | 'painting' | 'installation';
  name: string;
  standardRefs: StandardRef[];
  steps: ProcessStep[];
  images: string[];
  videoUrl?: string;
  commonProblems: string[];
}

export interface PitfallGuide {
  id: string;
  stage: 'water_electric' | 'masonry' | 'carpentry' | 'painting' | 'installation' | 'contract';
  title: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  symptoms: string[];
  solutions: string[];
  relatedProcessIds: string[];
  views: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CommunityAnswer {
  id: string;
  authorId: string;
  authorName: string;
  isExpert: boolean;
  isCertified: boolean;
  content: string;
  voteCount: number;
  comments: Comment[];
  createdAt: string;
}

export interface CommunityQuestion {
  id: string;
  ownerId: string;
  ownerName: string;
  clusterTag: string;
  title: string;
  content: string;
  images?: string[];
  stageTag?: string;
  answers: CommunityAnswer[];
  voteCount: number;
  viewCount: number;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  name: string;
  parentId?: string;
  startOffset: number;
  duration: number;
  actualStartOffset?: number;
  actualDuration?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  assignee: string;
  milestone?: boolean;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  companyId: string;
  address: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'planning' | 'in_progress' | 'delayed' | 'completed';
  tasks: ProjectTask[];
}

export interface MaterialSKU {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string;
  spec: string;
  unit: string;
  price: number;
  stock: number;
  supplierId: string;
  imageUrl?: string;
  materialCategory: 'floor' | 'wall' | 'tile' | 'cabinet' | 'door' | 'bath' | 'lamp' | 'other';
  applicableStyle: DesignStyle[];
}

export interface SupplierAPIConfig {
  id: string;
  supplierName: string;
  apiEndpoint: string;
  apiKey: string;
  syncInterval: number;
  lastSyncAt?: string;
}

export interface Statement {
  content: string;
  images: string[];
  submittedAt: string;
}

export interface Evidence {
  id: string;
  submittedBy: 'owner' | 'company' | 'mediator';
  type: 'image' | 'document' | 'contract' | 'video';
  url: string;
  description: string;
  uploadedAt: string;
}

export interface MediationLog {
  id: string;
  mediatorId: string;
  mediatorName: string;
  action: 'note' | 'proposal' | 'meeting' | 'escalate';
  content: string;
  createdAt: string;
}

export interface ArbitrationResult {
  expertIds: string[];
  conclusion: string;
  decision: string;
  issuedAt: string;
  accepted: boolean;
}

export interface DisputeCase {
  id: string;
  caseNumber: string;
  projectId: string;
  ownerId: string;
  companyId: string;
  title: string;
  category: 'quality' | 'schedule' | 'price' | 'material' | 'service' | 'other';
  status: 'new' | 'responding' | 'mediating' | 'arbitrating' | 'closed';
  ownerStatement: Statement;
  companyStatement: Statement;
  evidences: Evidence[];
  mediationLogs: MediationLog[];
  arbitrationResult?: ArbitrationResult;
  createdAt: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutrals: string[];
}

export interface InspirationItem {
  id: string;
  title: string;
  imageUrl: string;
  style: DesignStyle;
  roomType: string;
  colorPalette: ColorPalette;
  materialIds: string[];
  tags: string[];
  designerName?: string;
  likes: number;
  views: number;
}
