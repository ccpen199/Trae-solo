export interface GarbageCategory {
  id: string;
  cityId: string;
  code: 'recyclable' | 'harmful' | 'kitchen' | 'other' | string;
  name: string;
  icon: string;
  color: string;
  guidelines: string;
  misconceptions: string;
  updateTimestamp: number;
}

export interface GarbageItem {
  id: string;
  name: string;
  aliases: string[];
  categoryId: string;
  cityId: string;
  requirements: string;
  misconceptions: string;
}

export interface City {
  id: string;
  name: string;
  province: string;
  createdAt: number;
}

export interface RecognitionRequest {
  imageBase64: string;
  cityId: string;
}

export interface RecognitionPrediction {
  itemName: string;
  category: GarbageCategory;
  confidence: number;
  disposalRequirements: string;
  commonMisconceptions: string;
}

export interface RecognitionResult {
  success: boolean;
  predictions: RecognitionPrediction[];
  processingTime: number;
}

export interface SearchResult {
  item: GarbageItem;
  category: GarbageCategory;
  matchScore: number;
  matchedAlias?: string;
}

export interface FeedbackRequest {
  itemName: string;
  misjudgedCategoryId?: string;
  correctCategoryId: string;
  description?: string;
  imageUrl?: string;
  district?: string;
  street?: string;
  userAgent?: string;
}

export interface PdfDocument {
  id: string;
  cityId: string;
  fileName: string;
  fileSize: number;
  uploadTime: number;
  uploaderId: string;
  parsedContent: string;
  linkedItemIds: string[];
  version: string;
}

export interface StreetAccuracy {
  district: string;
  street: string;
  accuracy: number;
  totalQueries: number;
  feedbackCount: number;
}

export interface MisjudgmentItem {
  itemName: string;
  count: number;
  correctCategory: string;
  correctCategoryColor: string;
  misjudgedAs: string[];
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  admin: {
    id: string;
    username: string;
    role: string;
    cityId: string;
    district: string | null;
  };
}

export interface CategoryWithItems extends GarbageCategory {
  items: GarbageItem[];
}

export interface StandardPackage {
  city: City;
  categories: CategoryWithItems[];
  updateTimestamp: number;
}
