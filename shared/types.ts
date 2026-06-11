export type PropertyType = 'secondhand' | 'new' | 'rental' | 'overseas' | 'vacation';

export type PropertyStatus = 'pending' | 'verified' | 'listed' | 'sold' | 'rented' | 'removed' | 'flagged';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type AlertType = 'price_drop' | 'price_rise' | 'new_listing' | 'deviation';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ActivityType = 'mass_delisting' | 'price_manipulation' | 'fake_listing' | 'multiple_listings' | 'suspicious_contact';

export type MarketStatus = 'hot' | 'stable' | 'cooling' | 'sluggish';

export type UserRole = 'user' | 'broker' | 'owner' | 'admin' | 'regulator';

export type ReportStatus = 'submitted' | 'reviewing' | 'resolved' | 'rejected';

export type ReportType = 'fake_price' | 'fake_info' | 'fake_images' | 'already_sold' | 'other';

export interface District {
  id: string;
  name: string;
  city: string;
  area: number;
  propertyCount: number;
  avgPrice: number;
  priceChange7d: number;
  priceChange30d: number;
  priceChange90d: number;
  lat: number;
  lng: number;
}

export interface PricePoint {
  id: string;
  propertyId: string;
  price: number;
  date: string;
  type: 'listing' | 'transaction' | 'assessment';
  source: string;
}

export interface DistrictPrice {
  id: string;
  districtId: string;
  districtName: string;
  date: string;
  avgPrice: number;
  transactionCount: number;
  priceChange: number;
  priceChangePercent: number;
  supplyDemandRatio: number;
}

export interface VerificationNode {
  id: string;
  propertyId: string;
  step: number;
  title: string;
  description: string;
  status: VerificationStatus;
  operator: string;
  timestamp: string;
  hash: string;
  previousHash: string;
  evidence?: string[];
}

export interface PriceAlert {
  id: string;
  userId: string;
  type: AlertType;
  threshold: number;
  thresholdType: 'absolute' | 'percentage';
  targetType: 'property' | 'district' | 'community';
  targetId: string;
  targetName: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface AgentRiskProfile {
  id: string;
  brokerId: string;
  brokerName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  totalListings: number;
  flaggedListings: number;
  verifiedListings: number;
  recentActivities: string[];
  lastAssessment: string;
  riskFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
}

export interface SuspiciousActivity {
  id: string;
  type: ActivityType;
  description: string;
  brokerId?: string;
  propertyId?: string;
  detectedAt: string;
  severity: RiskLevel;
  status: 'detected' | 'investigating' | 'resolved' | 'dismissed';
  evidence: string[];
  assignedTo?: string;
}

export interface MarketHealth {
  id: string;
  city: string;
  date: string;
  status: MarketStatus;
  overallScore: number;
  supplyDemandRatio: number;
  inventoryTurnoverDays: number;
  priceVolatilityIndex: number;
  transactionVolume: number;
  transactionVolumeChange: number;
  avgPrice: number;
  avgPriceChange: number;
  newListings: number;
  newListingsChange: number;
  indicators: {
    name: string;
    value: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'property' | 'district' | 'community';
  targetId: string;
  targetName: string;
  isActive: boolean;
  notifyPriceDrop: boolean;
  notifyPriceRise: boolean;
  notifyNewListing: boolean;
  priceDropThreshold: number;
  priceRiseThreshold: number;
  createdAt: string;
  lastNotifiedAt?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  propertyId: string;
  propertyTitle: string;
  type: ReportType;
  description: string;
  evidence: string[];
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  resolution?: string;
}

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  nickname?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    propertyTypes: PropertyType[];
    districts: string[];
    priceRange?: [number, number];
  };
}

export interface Broker {
  id: string;
  userId: string;
  name: string;
  phone: string;
  company: string;
  licenseNumber: string;
  isVerified: boolean;
  avatar?: string;
  totalListings: number;
  verifiedListings: number;
  rating: number;
  reviewCount: number;
  riskScore: number;
  createdAt: string;
  specialties: string[];
  districts: string[];
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  unit: 'yuan' | 'yuan/sqm' | 'yuan/month';
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor?: string;
  totalFloors?: number;
  orientation?: string;
  decoration?: string;
  yearBuilt?: number;
  address: string;
  districtId: string;
  districtName: string;
  communityName: string;
  lat: number;
  lng: number;
  description?: string;
  images: string[];
  features: string[];
  tags: string[];
  brokerId?: string;
  brokerName?: string;
  ownerId?: string;
  isVerified: boolean;
  verificationNodes?: VerificationNode[];
  priceHistory: PricePoint[];
  currentPriceDeviation?: number;
  listedAt: string;
  lastUpdated: string;
  transactionDate?: string;
  transactionPrice?: number;
  views: number;
  favorites: number;
  inquiries: number;
}

export interface MarketOverview {
  city: string;
  date: string;
  totalListings: number;
  totalTransactions: number;
  avgPrice: number;
  avgPriceChange7d: number;
  avgPriceChange30d: number;
  supplyDemandRatio: number;
  inventoryTurnoverDays: number;
  byType: {
    type: PropertyType;
    count: number;
    avgPrice: number;
    priceChange: number;
  }[];
  topDistricts: DistrictPrice[];
  hotCommunities: {
    id: string;
    name: string;
    districtName: string;
    avgPrice: number;
    priceChange: number;
    transactionCount: number;
  }[];
}
