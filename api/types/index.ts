export interface Developer {
  id: string;
  name: string;
  qualification: string;
  level: '一级' | '二级' | '三级' | '四级';
  registeredCapital: number;
  establishedYear: number;
}

export interface BuildingLicense {
  id: string;
  name: string;
  number: string;
  issueDate: string;
  issuingAuthority: string;
}

export interface Building {
  id: string;
  name: string;
  totalFloors: number;
  unitsPerFloor: number;
  totalUnits: number;
  availableUnits: number;
  unitTypes: UnitType[];
  deliveryDate: string;
  decoration: '毛坯' | '简装' | '精装' | '豪装';
}

export interface UnitType {
  id: string;
  name: string;
  area: number;
  bedrooms: number;
  livingRooms: number;
  bathrooms: number;
  price: number;
  totalPrice: number;
  orientation: string;
}

export interface Property {
  id: string;
  name: string;
  developer: Developer;
  licenses: BuildingLicense[];
  buildings: Building[];
  address: string;
  district: string;
  area: string;
  lat: number;
  lng: number;
  price: number;
  priceRange: string;
  totalPriceRange: string;
  propertyType: '住宅' | '公寓' | '别墅' | '商铺' | '写字楼';
  buildingType: '高层' | '小高层' | '多层' | '洋房' | '联排' | '独栋';
  plotRatio: number;
  greenRate: number;
  parkingRatio: string;
  propertyFee: number;
  propertyCompany: string;
  totalHouseholds: number;
  openingDate: string;
  deliveryDate: string;
  decoration: '毛坯' | '简装' | '精装' | '豪装';
  status: '在售' | '待售' | '售罄' | '尾盘';
  tags: string[];
  schoolDistrict: string;
  subwayDistance: number;
  subwayStations: string[];
  supportingFacilities: string[];
  highlights: string[];
  governmentPrice: number;
  secondhandPrice: number;
  salesRate: number;
  monthlySales: number;
}

export interface SubwayStation {
  id: string;
  name: string;
  line: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
}

export interface SchoolDistrict {
  id: string;
  name: string;
  type: '小学' | '中学' | '九年一贯制';
  level: '省重点' | '市重点' | '区重点' | '普通';
  boundary: { lat: number; lng: number }[];
  lat: number;
  lng: number;
  correspondingProperties: string[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  value: number;
  type: 'price' | 'transaction' | 'popularity';
}

export interface UserRequirement {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  budgetMin: number;
  budgetMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  districts: string[];
  propertyTypes: string[];
  purpose: '自住' | '投资' | '改善' | '学区';
  schoolRequired: boolean;
  subwayRequired: boolean;
  decoration: string;
  deliveryDate: string;
  additionalNotes: string;
  createdAt: string;
  status: 'pending' | 'matched' | 'reviewed' | 'appointment_made' | 'viewing' | 'signed' | 'completed';
}

export interface MatchResult {
  id: string;
  requirementId: string;
  propertyId: string;
  property: Property;
  matchScore: number;
  matchReasons: string[];
  recommended: boolean;
}

export interface MatchReport {
  id: string;
  requirementId: string;
  requirement: UserRequirement;
  matches: MatchResult[];
  aiSummary: string;
  aiAdvice: string;
  createdAt: string;
  reviewed: boolean;
  reviewerName: string;
  reviewComments: string;
}

export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  experience: number;
  specialty: string[];
  rating: number;
  dealCount: number;
  status: 'available' | 'busy' | 'offline';
}

export interface ViewingAppointment {
  id: string;
  requirementId: string;
  propertyIds: string[];
  consultantId: string;
  consultant: Consultant;
  date: string;
  time: string;
  carService: boolean;
  pickupAddress: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface ContractProgress {
  id: string;
  requirementId: string;
  propertyId: string;
  propertyName: string;
  stages: ContractStage[];
  currentStage: number;
  estimatedCompleteDate: string;
}

export interface ContractStage {
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
  description: string;
}

export interface Subsidy {
  id: string;
  name: string;
  amount: number;
  type: 'red_packet' | 'coupon' | 'cashback';
  conditions: string;
  validFrom: string;
  validTo: string;
  totalCount: number;
  claimedCount: number;
  usedCount: number;
  minPurchaseAmount: number;
  status: 'active' | 'expired' | 'paused';
}

export interface UserSubsidy {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  subsidyId: string;
  subsidy: Subsidy;
  claimedAt: string;
  used: boolean;
  usedAt: string;
  propertyId: string;
  riskScore: number;
  riskFlags: string[];
  verificationCode: string;
}

export interface UserJourneyStep {
  step: string;
  stepName: string;
  userCount: number;
  conversionRate: number;
  avgDuration: number;
  dropOffReason: string[];
}

export interface UserJourneyFunnel {
  id: string;
  period: string;
  totalUsers: number;
  steps: UserJourneyStep[];
  overallConversion: number;
}

export interface PropertySalesData {
  propertyId: string;
  propertyName: string;
  governmentPrice: number;
  secondhandPrice: number;
  salesRate: number;
  monthlySales: number;
  competitorComparison: {
    propertyId: string;
    propertyName: string;
    priceDiff: number;
    salesRateDiff: number;
  }[];
}
