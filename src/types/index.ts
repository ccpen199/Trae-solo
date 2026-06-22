export interface Building {
  id: string;
  name: string;
  developer: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  totalUnits: number;
  availableUnits: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  areaMin: number;
  areaMax: number;
  deliveryDate: string;
  description: string;
  tags: string[] | string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  certificates?: Certificate[];
  priceHistory?: PriceHistoryItem[];
}

export interface Certificate {
  id: string;
  buildingId: string;
  type: string;
  number: string;
  status: string;
  issueDate: string;
  expireDate: string;
}

export interface PriceHistoryItem {
  month: string;
  avgPrice: number;
  volume: number;
}

export interface Property {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor: number;
  totalFloors: number;
  area: number;
  layout: string;
  orientation: string;
  price: number;
  unitPrice: number;
  status: string;
}

export interface CalculatorRequest {
  totalPrice: number;
  commercialLoan: number;
  commercialRate: number;
  fundLoan: number;
  fundRate: number;
  years: number;
  isFirstHome: boolean;
  area: number;
}

export interface TaxItem {
  name: string;
  rate: number;
  amount: number;
  description: string;
}

export interface RepaymentItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface CalculatorResult {
  monthlyPayment: number;
  commercialMonthly: number;
  fundMonthly: number;
  totalInterest: number;
  taxes: TaxItem[];
  repaymentPlan: RepaymentItem[];
}

export interface LotteryParticipant {
  id: string;
  building_id: string;
  name: string;
  phone: string;
}

export interface LotteryResultEntry {
  rank: number;
  participant: LotteryParticipant;
  hash: string;
}

export interface LotteryResult {
  building_id: string;
  participants: LotteryParticipant[];
  results: LotteryResultEntry[];
  seed: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  buildingId: string;
  submitterName: string;
  submitterPhone: string;
  category: string;
  title: string;
  content: string;
  status: string;
  timeline: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorContent {
  id: string;
  authorId: string;
  authorName: string;
  buildingId: string;
  type: string;
  title: string;
  content: string;
  images: string[] | string;
  likes: number;
  views: number;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  buildingId: string;
  type: string;
  title: string;
  summary: string;
  source: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  buildingId: string;
  type: string;
  createdAt: string;
}

export interface MapProperty {
  id: string;
  buildingId: string;
  buildingName: string;
  unitNumber: string;
  price: number;
  unitPrice: number;
  area: number;
  layout: string;
  floor: number;
  totalFloors: number;
  orientation: string;
  status: string;
  district: string;
  lat: number;
  lng: number;
}

export interface HeatmapData {
  district: string;
  lat: number;
  lng: number;
  avgPrice: number;
  volume: number;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  company: string;
  rating: number;
  deals: number;
  avatar: string;
}
