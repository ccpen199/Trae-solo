export interface CargoOrder {
  id: string
  orderNo: string
  erpOrderNo?: string
  enterpriseId: string
  enterpriseName: string
  cargoName: string
  cargoType: string
  weight: number
  volume: number
  quantity: number
  declaredValue: number
  temperatureRequired?: { min: number; max: number; unit: string }
  temperatureControlled?: boolean
  temperatureRange?: string
  origin: { province: string; city: string; address: string; contact: string; phone: string }
  destination: { province: string; city: string; address: string; contact: string; phone: string }
  pickupTime: string
  deliveryTime: string
  status: 'draft' | 'published' | 'bidding' | 'assigned' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'exception'
  specialRequirements?: string[]
  attachments?: { name: string; url: string }[]
  notes?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  assignedAt?: string
  distance?: number
  estimatedDays?: number
  baseFee?: number
  totalFee: number
  assignedCapacity?: {
    id: string
    name: string
    type: 'driver' | 'fleet'
    level: 'gold' | 'silver' | 'normal'
  }
  assignedCapacityId?: string
  waybillId?: string
}

export interface Capacity {
  id: string
  type: 'driver' | 'fleet'
  name: string
  level: 'gold' | 'silver' | 'normal'
  creditLevel: 'AAA' | 'AA' | 'A' | 'B'
  creditScore: number
  fulfillmentRate: number
  completionRate: number
  totalOrders: number
  experienceYears: number
  licensePlate?: string
  vehiclePlate?: string
  phone?: string
  vehicleType?: string
  vehicleLength?: number
  maxWeight?: number
  maxVolume?: number
  contactPerson: string
  contactPhone: string
  certifications: { type: string; status: 'valid' | 'expired' | 'pending'; expiryDate?: string }[]
  isReturnSource?: boolean
  returnRoute?: { from: string; to: string; availableDate: string; pricePerTon?: number }
  rating: number
  avatar: string
  joinedDate: string
}

export interface Waybill {
  id: string
  waybillNo: string
  cargoOrderId: string
  cargoOrderNo: string
  orderNo?: string
  capacityId: string
  driverName: string
  vehiclePlate: string
  status: 'loading' | 'in_transit' | 'unloading' | 'delivered' | 'exception'
  estimatedArrival: string
  actualArrival?: string
  cargoSummary: string
  route: { from: string; to: string }
  progress: number
  currentLocation?: { lat: number; lng: number; address: string }
  nodes: {
    id: string
    type: 'pickup' | 'transit' | 'stopover' | 'delivery'
    name: string
    location: { lat: number; lng: number }
    plannedTime: string
    actualTime?: string
    status: 'pending' | 'completed' | 'delayed'
    photos?: string[]
    remark?: string
  }[]
}

export interface Alert {
  id: string
  waybillId: string
  waybillNo: string
  type: 'stay_timeout' | 'temperature' | 'route_deviation' | 'delay' | 'accident'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  location?: { lat: number; lng: number; address: string }
  triggeredAt: string
  status: 'pending' | 'processing' | 'resolved'
  resolvedAt?: string
  handler?: string
  resolution?: string
  cargoInfo: string
}

export interface InsurancePolicy {
  id: string
  policyNo: string
  cargoOrderId: string
  cargoOrderNo: string
  orderNo?: string
  insurer: string
  insuranceType: 'basic' | 'comprehensive' | 'all_risk'
  cargoName: string
  cargoValue: number
  weight: number
  premium: number
  coverageAmount: number
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'expired' | 'claimed'
  route: string
  claimant?: {
    name: string
    phone: string
  }
  claim?: {
    status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid'
    amount?: number
    submittedAt?: string
    documents?: { name: string }[]
  }
}

export interface Claim {
  id: string
  claimNo: string
  policyId: string
  policyNo: string
  amount: number
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid'
  submittedAt: string
  paidAt?: string
  reason: string
  documents: { name: string }[]
  handler?: string
}

export interface ServiceOrder {
  id: string
  orderNo: string
  serviceType: 'etc' | 'fuel' | 'maintenance'
  capacityName: string
  vehiclePlate: string
  amount: number
  discount: number
  actualAmount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  detail: any
}

export interface EtcCard {
  id: string
  cardNo: string
  balance: number
  vehiclePlate: string
  status: 'active' | 'frozen' | 'expired'
  lastRecharge: string
  monthConsumption: number
}

export interface FuelCard {
  id: string
  cardNo: string
  brand: string
  balance: number
  discount: number
  vehiclePlate: string
  status: 'active' | 'inactive'
}

export interface MaintenanceOrder {
  id: string
  workOrderNo: string
  orderNo?: string
  vehiclePlate: string
  serviceType: string
  workshop: string
  shop?: { name: string }
  appointmentTime: string
  scheduledTime?: string
  technician?: string
  completedAt?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'closed'
  items: { name: string; price: number }[]
  totalAmount: number
  cost: number
  stages?: { name: string; done: boolean }[]
  rating?: number
}

export interface DashboardKPI {
  totalInTransit: number
  activeAlerts: number
  monthlyFreightCost: number
  insuranceClaimRate: number
  capacityPoolSize: number
  onTimeDeliveryRate: number
  totalCargoOrders: number
  totalPolicies: number
}

export interface TrendData {
  date: string
  value: number
}

export interface DistributionItem {
  name: string
  value: number
  color: string
}
