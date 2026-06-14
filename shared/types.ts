export type PropertyType = 'new' | 'secondhand' | 'rent';

export interface Property {
  id: string;
  type: PropertyType;
  title: string;
  price: number;
  unitPrice?: number;
  area: number;
  rooms: number;
  halls: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  buildYear: number;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  images: string[];
  vrUrl?: string;
  floorPlan?: string;
  description: string;
  propertyRight: PropertyRight;
  schoolDistrict?: SchoolDistrict;
  metroInfo?: MetroInfo;
  verification: Verification;
  agent?: Agent;
  ownerId?: string;
  publishTime: string;
  listingWeight: number;
  tags: string[];
}

export interface PropertyRight {
  type: string;
  status: 'normal' | 'mortgaged' | 'sealed';
  ownershipYears: number;
  isFiveYears: boolean;
  isOnlyOne: boolean;
}

export interface SchoolDistrict {
  name: string;
  level: 'primary' | 'middle' | 'high';
  quality: 'key' | 'ordinary';
  distance: number;
  enrollmentPolicy: string;
}

export interface MetroInfo {
  nearestStation: string;
  line: string;
  distance: number;
  walkTime: number;
}

export interface Verification {
  ownerVerified: boolean;
  agentVerified: boolean;
  antiFraudPassed: boolean;
  verifyTime: string;
  listingDays: number;
  decayWeight: number;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  company: string;
  licenseNumber: string;
  avatar: string;
  dealCount: number;
  rating: number;
  isVerified: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'user' | 'owner' | 'agent' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface SearchFilters {
  type?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number[];
  orientation?: string[];
  decoration?: string[];
  district?: string[];
  nearMetro?: boolean;
  schoolDistrict?: boolean;
  hasVR?: boolean;
  verifiedOnly?: boolean;
  sortBy?: 'price' | 'price-desc' | 'area' | 'time' | 'weight';
}

export interface MapBounds {
  southWest: { lat: number; lng: number };
  northEast: { lat: number; lng: number };
}

export interface MapSearchParams {
  bounds: MapBounds;
  filters: SearchFilters;
}

export interface MetroSearchParams {
  stationName: string;
  radius: number;
  filters: SearchFilters;
}

export interface PriceTrendPoint {
  date: string;
  avgPrice: number;
  changeRate: number;
  volume: number;
}

export interface MortgageParams {
  totalPrice: number;
  downPaymentRatio: number;
  loanYears: number;
  interestRate: number;
  repaymentType: 'equal-principal' | 'equal-interest';
}

export interface MonthlyDetail {
  month: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface MortgageResult {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  monthlyDetails: MonthlyDetail[];
}

export interface TaxParams {
  propertyType: 'new' | 'secondhand';
  totalPrice: number;
  area: number;
  isFirstHouse: boolean;
  isFiveYears: boolean;
  isOnlyOne: boolean;
  originalPrice?: number;
}

export interface TaxBreakdown {
  name: string;
  amount: number;
  rate: string;
}

export interface TaxResult {
  deedTax: number;
  incomeTax: number;
  valueAddedTax: number;
  stampDuty: number;
  agencyFee: number;
  total: number;
  breakdown: TaxBreakdown[];
}

export interface ViewingRecord {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  clientId: string;
  clientName?: string;
  agentId: string;
  date: string;
  timeSlot: string;
  feedback: string;
  interestLevel: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  level: 'A' | 'B' | 'C';
  budgetMin: number;
  budgetMax: number;
  preference: string;
  agentId: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  clientId: string;
  clientName?: string;
  agentId: string;
  dealPrice: number;
  commission: number;
  dealDate: string;
  status: 'pending' | 'completed' | 'reported';
  createdAt: string;
}

export interface RegulatoryReport {
  id: string;
  dealId: string;
  reportId: string;
  reportTime: string;
  status: 'pending' | 'success' | 'failed';
  governmentResponse?: string;
  createdAt: string;
}

export interface AntiFraudRecord {
  id: string;
  propertyId: string;
  checkType: 'image-similarity' | 'list-frequency';
  result: 'pass' | 'fail' | 'warning';
  score: number;
  details: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
