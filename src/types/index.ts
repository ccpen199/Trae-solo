export interface Equipment {
  id: string
  name: string
  rarity: "common" | "rare" | "epic" | "legendary"
  type: string
  level: number
  stats: Record<string, number>
  imageUrl: string
}

export interface Account {
  id: string
  gameUid: string
  gameName: string
  server: string
  region: string
  level: number
  equipmentSnapshot: Equipment[]
  snapshotHash: string
  chainTxHash: string
  owner: string
  status: "available" | "rented" | "selling" | "sold" | "recycled"
  price: number
  rentPriceHourly: number
  rentPriceDaily: number
  valuation: number
  riskScore: number
  insuranceActive: boolean
  createdAt: string
  imageUrl: string
}

export interface LocationAlert {
  id: string
  location: string
  timestamp: string
  ip: string
}

export interface RentalOrder {
  id: string
  accountId: string
  renterId: string
  startTime: string
  endTime: string
  deposit: number
  rentFee: number
  deviceFingerprint: string
  riskStatus: "normal" | "warning" | "alert" | "circuit_break"
  behaviorScore: number
  locationAlerts: LocationAlert[]
}

export interface TradeOrder {
  id: string
  accountId: string
  buyerId: string
  sellerId: string
  amount: number
  contractStatus: "pending" | "signed" | "escrow_frozen" | "releasing" | "completed" | "disputed"
  escrowStatus: "frozen" | "releasing" | "released" | "refunded"
  contractHash: string
  disputeStatus?: "pending" | "arbitrating" | "resolved"
}

export interface RecycleBid {
  id: string
  recyclerId: string
  recyclerName: string
  accountId: string
  bidAmount: number
  weightScore: number
  heatScore: number
  valuationScore: number
  timelinessScore: number
  estimatedTime: string
  createdAt: string
}

export interface InsuranceClaim {
  id: string
  accountId: string
  policyId: string
  contractId: string
  contractStatus: "active" | "breached" | "claimed"
  claimStatus: "pending" | "verifying" | "approved" | "paid"
  claimAmount: number
  autoTriggered: boolean
  triggeredAt?: string
}

export interface RiskAlert {
  id: string
  type: "device_change" | "behavior_anomaly" | "remote_login" | "cluster_anomaly" | "brush_order"
  severity: "low" | "medium" | "high" | "critical"
  accountId: string
  description: string
  timestamp: string
}

export interface TransactionRecord {
  id: string
  type: "rent" | "buy" | "sell" | "recycle"
  gameName: string
  amount: number
  timestamp: string
  status: "completed" | "processing" | "pending"
}
