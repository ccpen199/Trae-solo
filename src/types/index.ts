export interface AddressInfo {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  fullAddress?: string
  latitude?: number
  longitude?: number
}

export type PackagingType = 'none' | 'wooden_box' | 'wooden_pallet' | 'wooden_frame' | 'plastic_pallet' | 'iron_frame'

export interface CargoItem {
  id: string
  name: string
  length: number
  width: number
  height: number
  actualWeight: number
  volumeWeight: number
  chargeWeight: number
  quantity: number
  packaging: PackagingType
  value: number
  isOversize?: boolean
  isOverweight?: boolean
}

export interface OrderServices {
  pickup: boolean
  delivery: boolean
  upstairs: boolean
  insurance: boolean
  temperatureControl: boolean
}

export interface OrderCreateRequest {
  sender: AddressInfo
  receiver: AddressInfo
  cargoList: CargoItem[]
  services: OrderServices
  pickupTime: string
  remark: string
}

export interface OrderQuoteResponse {
  baseFreight: number
  pickupFee: number
  deliveryFee: number
  upstairsFee: number
  packagingFee: number
  insuranceFee: number
  temperatureFee: number
  overweightSurcharge: number
  oversizeSurcharge: number
  total: number
  estimatedDays: number
}

export interface PackagingOption {
  type: PackagingType
  name: string
  description: string
  baseMaterialPrice: number
  laborPricePerHour: number
  fumigationFee: number
  reinforceFee: number
  unit: string
}

export interface PackagingQuoteItem {
  type: PackagingType
  name: string
  specs: string
  quantity: number
  materialCost: number
  laborCost: number
  fumigationCost: number
  reinforceCost: number
  subtotal: number
}

export interface MeasurementAppointment {
  id: string
  address: AddressInfo
  appointmentTime: string
  contactName: string
  contactPhone: string
  cargoDescription: string
  photos: string[]
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
}

export interface MonitorData {
  timestamp: string
  temperature: number
  humidity: number
  vibration: number
  latitude: number
  longitude: number
  speed: number
  location: string
}

export type AlertType = 'temperature' | 'humidity' | 'vibration' | 'geo'
export type AlertLevel = 'warning' | 'critical'

export interface AlertEvent {
  id: string
  waybillNo: string
  type: AlertType
  level: AlertLevel
  value: number
  threshold: number
  unit: string
  timestamp: string
  location: string
  message: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface Waypoint {
  name: string
  latitude: number
  longitude: number
  type: 'start' | 'end' | 'restriction' | 'checkpoint'
  restriction?: {
    type: 'height' | 'weight' | 'width' | 'time'
    value: number
    unit: string
  }
}

export interface RoutePlan {
  id: string
  name: string
  distance: number
  duration: number
  tollCost: number
  fuelCost: number
  totalCost: number
  heightRiskCount: number
  weightRiskCount: number
  restrictionCount: number
  riskLevel: 'low' | 'medium' | 'high'
  waypoints: Waypoint[]
}

export interface VideoReviewItem {
  id: string
  waybillNo: string
  vehiclePlate: string
  driverName: string
  operationType: 'loading' | 'unloading'
  videoUrl: string
  thumbnailUrl: string
  duration: number
  uploadedAt: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  aiScore: number
  reviewer?: string
  reviewedAt?: string
  reviewComment?: string
  tags: string[]
}

export interface InvoiceItem {
  id: string
  invoiceNo: string
  invoiceDate: string
  amount: number
  imageUrl: string
}

export interface ClaimOCRResult {
  waybillNo: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  cargoName: string
  cargoQuantity: number
  declaredValue: number
  freight: number
  confidence: number
}

export interface ClaimRequest {
  id: string
  waybillNo: string
  damageType: string
  damageDescription: string
  damagePhotos: string[]
  repairInvoices: InvoiceItem[]
  claimAmount: number
  approvedAmount?: number
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid'
  createdAt: string
  ocrResult?: ClaimOCRResult
}

export interface VehicleInfo {
  plateNo: string
  vehicleType: string
  driverName: string
  driverPhone: string
  maxWeight: number
  height: number
  length: number
  gpsDeviceId: string
  status: 'running' | 'idle' | 'maintenance' | 'offline'
  currentLocation?: string
  currentSpeed?: number
  lastUpdateTime: string
  onlineStatus: 'online' | 'offline'
  transportPlatformConnected: boolean
}

export interface ApiParam {
  name: string
  type: string
  required: boolean
  description: string
  in: 'query' | 'body' | 'path' | 'header'
  example?: any
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  name: string
  description: string
  category: string
  params: ApiParam[]
  responseExample: any
  requestExample?: any
}

export interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  activeVehicles: number
  pendingAlerts: number
  weeklyOrderTrend: { date: string; count: number; revenue: number }[]
  serviceDistribution: { name: string; value: number }[]
  alertDistribution: { type: string; count: number; level: string }[]
}

export interface SdkDownloadItem {
  language: string
  version: string
  size: string
  updatedAt: string
  description: string
}

export interface FaqItem {
  question: string
  answer: string
  category: string
}

export interface ScenarioOption {
  id: string
  name: string
  icon: string
  description: string
}

export interface ValueAddedService {
  id: string
  name: string
  price: string
  description: string
}

export interface ProcessStep {
  title: string
  description: string
  duration?: string
  icon: string
}
