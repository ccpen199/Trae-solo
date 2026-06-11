export interface Property {
  id: string;
  title: string;
  address: string;
  district: string;
  price: number;
  unitPrice: number;
  area: number;
  rooms: number;
  halls: number;
  orientation: string;
  floor: string;
  buildYear: number;
  images: string[];
  vrEnabled: boolean;
  verification: VerificationResult;
  propertyRights: PropertyRights;
  priceHistory: PriceRecord[];
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResult {
  overallScore: number;
  priceCrossCheck: {
    score: number;
    sources: PriceSource[];
    deviation: number;
  };
  imageTampering: {
    score: number;
    flaggedImages: string[];
    issues: string[];
  };
  agentConsistency: {
    score: number;
    totalListings: number;
    inconsistentCount: number;
  };
  status: 'verified' | 'pending' | 'flagged';
}

export interface PropertyRights {
  mortgageStatus: 'none' | 'active' | 'cleared';
  seizureStatus: 'none' | 'active';
  lastChecked: string;
  ownershipChain: OwnershipRecord[];
}

export interface OwnershipRecord {
  owner: string;
  startDate: string;
  endDate: string;
  type: 'purchase' | 'inherit' | 'transfer';
}

export interface PriceRecord {
  date: string;
  price: number;
  type: 'listing' | 'transaction';
}

export interface PriceSource {
  platform: string;
  price: number;
  lastUpdated: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  storeId: string;
  storeName: string;
  creditScore: number;
  specializations: string[];
  serviceAreas: string[];
  totalTransactions: number;
  viewingsCompleted: number;
  conversionFunnel: ConversionFunnel;
  recentViewings: ViewingRecord[];
  creditHistory: CreditRecord[];
}

export interface ConversionFunnel {
  leads: number;
  viewings: number;
  intentions: number;
  transactions: number;
}

export interface ViewingRecord {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface CreditRecord {
  date: string;
  score: number;
  change: number;
  reason: string;
}

export interface Buyer {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  demandProfile: DemandProfile;
  vrHistory: VRViewingRecord[];
  favorites: string[];
}

export interface DemandProfile {
  budgetRange: [number, number];
  commuteCenter: string;
  commuteRadius: number;
  schoolPreference: string[];
  roomPreference: number[];
  areaRange: [number, number];
  preferredDistricts: string[];
}

export interface VRViewingRecord {
  propertyId: string;
  propertyTitle: string;
  viewedAt: string;
  totalDuration: number;
  heatZones: HeatZone[];
  attentionPoints: AttentionPoint[];
}

export interface HeatZone {
  zone: string;
  duration: number;
  percentage: number;
}

export interface AttentionPoint {
  feature: string;
  duration: number;
  interactions: number;
}

export interface DispatchTask {
  id: string;
  clientId: string;
  clientName: string;
  propertyIds: string[];
  intentStrength: 'high' | 'medium' | 'low';
  scheduledTime: string;
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed';
  assignedAgentId?: string;
  matchedAgents: AgentMatch[];
}

export interface AgentMatch {
  agentId: string;
  agentName: string;
  distance: number;
  distanceScore: number;
  intentMatchScore: number;
  transactionRateScore: number;
  totalScore: number;
}

export interface Organization {
  id: string;
  name: string;
  stores: Store[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  teams: Team[];
  performance: PerformanceMetrics;
}

export interface Team {
  id: string;
  name: string;
  memberCount: number;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  totalRevenue: number;
  transactionCount: number;
  averagePrice: number;
  viewingCount: number;
  conversionRate: number;
  monthOverMonth: number;
}

export interface PricePrediction {
  propertyId: string;
  currentPrice: number;
  predictions: PredictionPoint[];
  confidence: number;
  comparableListings: ComparableListing[];
}

export interface PredictionPoint {
  month: string;
  predictedPrice: number;
  lowerBound: number;
  upperBound: number;
}

export interface ComparableListing {
  address: string;
  price: number;
  area: number;
  unitPrice: number;
  soldDate: string;
}

export interface TaxDetail {
  name: string;
  rate: number;
  base: number;
  amount: number;
  description: string;
}
