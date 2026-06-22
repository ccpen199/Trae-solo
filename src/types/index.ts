export interface RiskItem {
  id: string
  type: "property" | "contract" | "business"
  level: "low" | "medium" | "high"
  title: string
  description: string
  suggestion: string
}

export interface Storefront {
  id: string
  title: string
  propertyType: "自有" | "租赁" | "合作"
  area: number
  rent: number
  transferFee: number
  district: string
  address: string
  industry: string[]
  panoramas: string[]
  model3dUrl: string
  verified: boolean
  verificationDetails: {
    commerce: "passed" | "failed" | "pending"
    housing: "passed" | "failed" | "pending"
  }
  riskLevel: "low" | "medium" | "high"
  riskItems: RiskItem[]
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export interface Merchant {
  id: string
  name: string
  phone: string
  licenseOcrResult: {
    companyName: string
    unifiedCode: string
    legalPerson: string
    businessScope: string
    confidence: number
  }
  industry: string
  budgetRange: [number, number]
  businessYears: number
  preferredDistricts: string[]
}

export interface DistrictProfile {
  id: string
  name: string
  footTraffic: { date: string; value: number }[]
  competitionDensity: { category: string; count: number }[]
  consumptionLevel: { tier: string; percentage: number }[]
  avgRent: number
  onlineStores: number
}

export interface Broker {
  id: string
  name: string
  avatar: string
  certified: boolean
  rating: number
  dealCount: number
  viewings: Viewing[]
  commissions: Commission[]
}

export interface Viewing {
  id: string
  storeId: string
  storeTitle: string
  clientName: string
  scheduledAt: string
  status: "scheduled" | "completed" | "cancelled"
  notes: string
}

export interface Commission {
  id: string
  dealId: string
  storeTitle: string
  amount: number
  status: "pending" | "settled" | "withdrawn"
  settledAt?: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: "transfer_tips" | "location_skills" | "avoid_pitfalls"
  author: string
  authorRole: "merchant" | "broker"
  content: string
  excerpt: string
  coverUrl: string
  likes: number
  bookmarks: number
  comments: number
  createdAt: string
}

export interface MatchRequest {
  industry: string
  budgetRange: [number, number]
  businessYears: number
  preferredDistricts: string[]
  areaRange?: [number, number]
}

export interface MatchResult {
  storeId: string
  score: number
  dimensions: {
    industry: number
    budget: number
    experience: number
    location: number
  }
}

export interface PricingRequest {
  district: string
  area: number
  propertyType: "自有" | "租赁" | "合作"
  industry: string
}

export interface PricingResult {
  suggestedMin: number
  suggestedMax: number
  suggestedAvg: number
  historicalData: { month: string; avgRent: number; avgTransferFee: number }[]
  comparables: { title: string; rent: number; transferFee: number; area: number }[]
}
