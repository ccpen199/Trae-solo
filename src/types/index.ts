export type PropertyStatus = 'notice' | 'due-diligence' | 'deposit' | 'bidding' | 'ended' | 'sold';

export type RiskLevel = 'high' | 'medium' | 'low';

export interface Property {
  id: string;
  title: string;
  address: string;
  district: string;
  area: number;
  rooms: number;
  floor: string;
  orientation: string;
  startingPrice: number;
  appraisalPrice: number;
  deposit: number;
  court: string;
  status: PropertyStatus;
  auctionStartTime: string;
  auctionEndTime: string;
  images: string[];
  vrUrl?: string;
  riskTags: string[];
  riskLevel: RiskLevel;
  buildingAge?: number;
  propertyType?: string;
  decoration?: string;
  floorPlanUrl?: string;
  bidCount?: number;
  viewerCount?: number;
}

export interface PropertyReport {
  id: string;
  propertyId: string;
  ownershipStatus: 'clear' | 'mortgaged' | 'seized' | 'disputed';
  mortgageInfo: {
    hasMortgage: boolean;
    mortgageAmount: number;
    mortgagee: string;
    mortgageDate: string;
  };
  seizureRecord: {
    hasSeizure: boolean;
    seizureCourt: string;
    seizureDate: string;
    seizureCount: number;
  };
  householdInfo: {
    hasHousehold: boolean;
    householdCount: number;
    canMoveOut: boolean;
  };
  leaseInfo: {
    hasLease: boolean;
    leaseTerm: string;
    lessee: string;
  };
  arrears: {
    propertyTax: number;
    utilityFee: number;
    propertyFee: number;
    totalArrears: number;
  };
  reportDate: string;
  reportNo: string;
}

export interface AuctionProcess {
  id: string;
  propertyId: string;
  currentPhase: 'notice' | 'due-diligence' | 'deposit' | 'bidding' | 'ended';
  noticeStart: string;
  noticeEnd: string;
  dueDiligenceStart: string;
  dueDiligenceEnd: string;
  depositDeadline: string;
  auctionStart: string;
  auctionEnd: string;
  resultDate?: string;
}

export interface MarketData {
  district: string;
  avgPrice: number;
  avgPriceChange: number;
  unsoldRate: number;
  premiumRate: number;
  transactionCount: number;
  period: string;
}

export interface MarketTrendPoint {
  month: string;
  avgPrice: number;
  transactionCount: number;
}

export interface TaxResult {
  deedTax: number;
  individualTax: number;
  valueAddedTax: number;
  stampTax: number;
  total: number;
  breakdown: {
    name: string;
    rate: string;
    amount: number;
    description: string;
  }[];
}

export interface BidRecord {
  id: string;
  propertyId: string;
  bidderName: string;
  amount: number;
  time: string;
}

export interface Bidder {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  creditScore: number;
  fundProofStatus: 'pending' | 'verified' | 'rejected';
  status: 'normal' | 'restricted' | 'blacklist';
  registerDate: string;
}

export interface DepositRecord {
  id: string;
  propertyId: string;
  propertyTitle: string;
  amount: number;
  status: 'paid' | 'refunding' | 'refunded' | 'frozen';
  payDate: string;
  refundDate?: string;
  orderNo: string;
}

export interface CompareDimension {
  key: string;
  label: string;
  category: string;
}

export interface ScoreResult {
  overall: number;
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
  }[];
}

export type DocumentType = 'report' | 'assessment' | 'notice' | 'verdict';

export interface DiligenceDocument {
  id: string;
  propertyId?: string;
  title: string;
  type: DocumentType;
  typeLabel: string;
  issueDate: string;
  issuer: string;
  fileSize: string;
  downloadUrl: string;
}

export interface AuctionPhase {
  key: string;
  label: string;
  description: string;
  startTime?: string;
  endTime?: string;
  status: 'completed' | 'current' | 'upcoming';
}
