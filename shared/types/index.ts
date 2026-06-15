export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'designer' | 'admin';
  createdAt: Date | string;
}

export interface Designer {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected';
  certificationNo?: string;
  yearsOfExperience?: number;
  styleTags?: string[];
  qualityScore?: number;
  totalCases?: number;
  createdAt?: Date | string;
  title?: string;
  company?: string;
  experience?: number;
  rating?: number;
  completedCases?: number;
  specialties?: string[];
  bio?: string;
  portfolio?: string[];
  applyTime?: string;
  reviewTime?: string;
}

export interface AcceptancePhoto {
  id: string;
  stage: 'concealed' | 'mud-wood' | 'paint';
  url: string;
  description: string;
  takenAt: Date | string;
  inspector?: string;
  verified?: boolean;
}

export interface CaseMaterial {
  id?: string;
  materialId: string;
  name?: string;
  brand?: string;
  model?: string;
  quantity: number;
  unit: string;
  roomLocation?: string;
}

export interface CaseImage {
  id: string;
  url: string;
  type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'floorplan';
}

export interface Case {
  id: string;
  designerId: string;
  title: string;
  style: string;
  area: number;
  budget: number;
  bathrooms: number;
  city: string;
  materials: CaseMaterial[];
  createdAt: Date | string;
  designerName?: string;
  designerAvatar?: string;
  description?: string;
  coverImage?: string;
  images?: CaseImage[];
  bedrooms?: number;
  layout?: string;
  tags?: string[];
  likes?: number;
  views?: number;
  district?: string;
  houseType?: string;
  rooms?: number;
  duration?: number;
  floorPlanSvg?: string;
  electricPlanSvg?: string;
  waterPlanSvg?: string;
  acceptancePhotos?: AcceptancePhoto[];
  status?: string;
  qualityScore?: number;
}

export interface LocalSupplier {
  id: string;
  materialId: string;
  marketName: string;
  address: string;
  phone: string;
  price: number;
  stock: number;
  city?: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  description?: string;
  image?: string;
  specifications?: Record<string, string>;
  model?: string;
  specs?: string;
  jdPrice?: number;
  tmallPrice?: number;
  imageUrl?: string;
  localSuppliers?: LocalSupplier[];
}

export interface StagePhoto {
  id: string;
  url: string;
  description: string;
  takenAt: string;
  inspector: string;
  verified: boolean;
}

export interface OCRMaterial {
  id: string;
  brand: string;
  model: string;
  name: string;
  unitPrice: number;
  ocrVerified: boolean;
}

export interface ReviewRecord {
  id: string;
  date: string;
  inspector: string;
  conclusion: 'pass' | 'warning' | 'recheck';
  description: string;
}

export interface EvidenceStageDetail {
  photos: StagePhoto[];
  ocrMaterials: OCRMaterial[];
  reviewRecords: ReviewRecord[];
  ocrAccuracy: number;
  totalReviews: number;
}

export interface MaterialPrice {
  id: string;
  materialId: string;
  price: number;
  region: string;
  supplier: string;
  updatedAt: string;
}

export interface QualityScore {
  id: string;
  caseId: string;
  completeness: number;
  photoQuality: number;
  dataAccuracy: number;
  designScore: number;
  totalScore: number;
  reviewedBy?: string;
  createdAt: Date | string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface CaseFilterParams extends PaginationParams {
  city?: string;
  houseType?: string;
  style?: string;
  minBudget?: number;
  maxBudget?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number;
  keyword?: string;
  sortBy?: 'similarity' | 'newest' | 'views' | 'score';
}

export interface FloorplanMatchRequest {
  area: number;
  bedrooms: number;
  bathrooms: number;
  layout?: string;
  style?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export interface DesignerApplyRequest {
  userId: string;
  name: string;
  title: string;
  company: string;
  experience: number;
  specialties: string[];
  bio: string;
  portfolio: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
