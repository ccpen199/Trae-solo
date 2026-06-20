export type UserRole = 'artist' | 'agency_admin' | 'company_hr' | 'admin';
export type ContractStatus = 'available' | 'signed' | 'exclusive' | 'unavailable';
export type ScheduleStatus = 'available' | 'booked' | 'pending' | 'unavailable';
export type CastingStatus = 'draft' | 'published' | 'closed' | 'completed';
export type ApplicationStatus = 'pending' | 'shortlisted' | 'interview' | 'hired' | 'rejected';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  realName: string;
  stageName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
  eyeColor: string;
  hairColor: string;
  languages: string[];
  skills: string[];
  location: string;
  latitude: number;
  longitude: number;
  contractStatus: ContractStatus;
  agencyId?: string;
  mediaAssets: MediaAsset[];
  tags: TalentTag[];
}

export interface MediaAsset {
  id: string;
  type: 'photo' | 'video' | 'three_view';
  url: string;
  isPrimary: boolean;
  order: number;
  metadata: Record<string, any>;
}

export interface TalentTag {
  id: string;
  tag: string;
  category: 'appearance' | 'skill' | 'language' | 'experience';
  weight: number;
}

export interface Schedule {
  id: string;
  artistProfileId: string;
  date: Date;
  status: ScheduleStatus;
  description?: string;
  castingId?: string;
}

export interface ModelCardTemplate {
  id: string;
  name: string;
  category: string;
  platform: string;
  layout: Record<string, any>;
  thumbnailUrl: string;
  width: number;
  height: number;
  isPremium: boolean;
}

export interface ModelCard {
  id: string;
  artistProfileId: string;
  templateId: string;
  name: string;
  customizations: Record<string, any>;
  exportedUrl?: string;
  exportedSizes: string[];
}

export interface Agency {
  id: string;
  ownerId: string;
  name: string;
  businessLicense: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Casting {
  id: string;
  agencyId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  startDate: Date;
  endDate: Date;
  status: CastingStatus;
  requirements: CastingRequirement[];
  createdAt: Date;
}

export interface CastingRequirement {
  field: string;
  operator: 'eq' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
}

export interface CastingApplication {
  id: string;
  castingId: string;
  artistProfileId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  appliedAt: Date;
}

export interface SearchCriteria {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  weightMin?: number;
  weightMax?: number;
  location?: string;
  radius?: number;
  skills?: string[];
  languages?: string[];
  contractStatus?: string;
  availableFrom?: Date;
  availableTo?: Date;
  tags?: string[];
}

export interface Authorization {
  id: string;
  grantorId: string;
  granteeId: string;
  dataScope: string[];
  expiresAt?: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface MatchResult {
  artist: ArtistProfile;
  score: number;
  matchReasons: string[];
  conflicts: ScheduleConflict[];
}

export interface ScheduleConflict {
  date: Date;
  type: 'schedule_booked' | 'location_mismatch' | 'contract_restriction';
  description: string;
}

export type ElementType = 'photo' | 'text' | 'shape' | 'social-icon' | 'divider';
export type ShapeType = 'rectangle' | 'circle' | 'line';
export type SocialIconType = 'instagram' | 'tiktok' | 'wechat' | 'weibo' | 'xiaohongshu';
export type ExportSize = 'instagram-square' | 'tiktok-story' | 'letter' | 'a4' | 'custom';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  content?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    imageUrl?: string;
    shapeType?: ShapeType;
    shapeColor?: string;
    socialIconType?: SocialIconType;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
}

export interface EditorHistoryState {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
}

export interface ExportOption {
  id: ExportSize;
  name: string;
  width: number;
  height: number;
  category: 'social' | 'print' | 'custom';
}

export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'studio' | 'outdoor' | 'urban' | 'abstract';
  thumbnailUrl: string;
  gradient?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface ExtendedSearchCriteria extends SearchCriteria {
  bustMin?: number;
  bustMax?: number;
  waistMin?: number;
  waistMax?: number;
  hipsMin?: number;
  hipsMax?: number;
  eyeColor?: string;
  hairColor?: string;
  experienceMin?: number;
  hasCommercialExperience?: boolean;
  hasFilmTvExperience?: boolean;
}
