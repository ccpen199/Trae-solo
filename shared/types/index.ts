export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'assigned'
  | 'picked'
  | 'completed'
  | 'exception'
  | 'delivering'

export type RiderStatus = 'online' | 'offline' | 'busy'

export type CreditReasonType = 'on_time' | 'complaint' | 'equipment'

export type CompensationType = 'timeout' | 'lost' | 'damaged'

export type CompensationStatus = 'pending' | 'approved' | 'rejected' | 'issued'

export type WaybillStatus = 'generated' | 'printed' | 'voided'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  orderNo?: string
  order_no: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  user_id?: string
  merchant_id?: string
  riderId?: string | null
  rider_id?: string | null
  riderName?: string
  pickupAddress?: string
  pickup_address: string
  pickupLat?: number
  pickup_lat: number
  pickupLng?: number
  pickup_lng: number
  deliveryAddress?: string
  delivery_address: string
  deliveryLat?: number
  delivery_lat: number
  deliveryLng?: number
  delivery_lng: number
  goods_type: string
  goods_weight: number
  distance_km?: number
  distance?: number
  estimated_price: number
  actual_price?: number | null
  status: OrderStatus
  items?: OrderItem[]
  totalAmount?: number
  estimatedDeliveryTime?: string
  estimated_delivery_time?: string
  estimated_delivery_at?: string | null
  actualDeliveryTime?: string | null
  actual_delivery_time?: string | null
  createdAt?: string
  created_at: string
  updatedAt?: string
  updated_at?: string
  assigned_at?: string | null
  picked_up_at?: string | null
  completed_at?: string | null
  exception_type?: string | null
  exception_reason?: string | null
  is_abnormal?: boolean
}

export interface Rider {
  id: string
  name: string
  phone: string
  avatar?: string | null
  status: RiderStatus
  credit_score: number
  credit_level?: string
  currentLat?: number | null
  current_lat: number | null
  currentLng?: number | null
  current_lng: number | null
  on_time_rate: number
  complaint_rate: number
  equipment_compliant: boolean
  vehicle_type?: string
  total_orders?: number
  created_at: string
}

export interface RiderLocation {
  riderId: string
  rider_id?: string
  lat: number
  lng: number
  timestamp: string
  heading?: number
  speed?: number
}

export interface OrderEvent {
  id: string
  orderId?: string
  order_id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

export interface CreditRecord {
  id: string
  riderId?: string
  rider_id: string
  score_change: number
  reason: string
  reason_type: CreditReasonType
  created_at: string
}

export interface Compensation {
  id: string
  orderId?: string
  order_id: string
  riderId?: string
  rider_id?: string
  user_id?: string
  type: CompensationType
  amount: number
  status: CompensationStatus
  coupon_id?: string | null
  voucher_code?: string | null
  reason?: string
  created_at: string
  processed_at?: string | null
}

export interface Waybill {
  id: string
  orderId?: string
  order_id: string
  waybill_no: string
  tax_amount: number
  tax_rate: number
  pdf_url?: string
  status: WaybillStatus
  created_at: string
  sender_name?: string
  sender_phone?: string
  sender_address?: string
  receiver_name?: string
  receiver_phone?: string
  receiver_address?: string
  goods_description?: string
  goods_weight?: number
  total_amount?: number
  exported?: boolean
}

export interface PricingRule {
  id: string
  name: string
  base_price: number
  price_per_km: number
  weight_surcharge: number
  peak_hour_multiplier: number
  weather_multiplier: number
  weather_condition: string
  min_order_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PricingConfig {
  id: number | string
  base_price: number
  price_per_km: number
  peak_hour_multiplier: number
  bad_weather_multiplier?: number
  fragile_multiplier?: number
  heavy_multiplier?: number
  night_surcharge?: number
  weight_surcharge?: number
  weather_multiplier?: number
  weather_condition?: string
  min_order_amount?: number
  is_active?: boolean
  name?: string
  created_at?: string
  updated_at: string
}

export interface OrderAlert {
  id: string
  orderId: string
  type: 'delay' | 'exception' | 'urgent' | 'info'
  level: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
}

export interface DashboardMetrics {
  totalOrders?: number
  pendingOrders?: number
  inTransitOrders?: number
  deliveredOrders?: number
  cancelledOrders?: number
  activeRiders?: number
  avgDeliveryTime?: number
  todayRevenue?: number
  total_orders: number
  completed_orders: number
  pending_orders: number
  in_progress_orders?: number
  exception_orders: number
  total_revenue: number
  active_riders: number
  avg_delivery_time: number
}

export interface ServerEventMap {
  'order:status': { orderId: string; status: OrderStatus; timestamp: string }
  'rider:location': RiderLocation
  'order:new': Order
  'order:alert': OrderAlert
  'dashboard:metrics': DashboardMetrics
}

export interface ClientEventMap {
  'dashboard:subscribe': (channels: string[]) => void
  'dashboard:unsubscribe': (channels: string[]) => void
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: 'admin' | 'dispatcher' | 'rider' | 'customer'
    name: string
  }
}

export type FlowNodeType = 'success' | 'warning' | 'error' | 'info'

export interface AbnormalFlowRecord {
  id: string
  orderId: string
  order_id: string
  nodeType: FlowNodeType
  title: string
  operator: string
  operatorRole?: string
  timestamp: string
  content: string
  remark?: string
  attachments?: string[]
}

export interface ReviewRecord {
  id: string
  orderId: string
  order_id: string
  reviewer: string
  reviewerRole?: string
  timestamp: string
  result: 'pass' | 'follow_up' | 'escalate'
  content: string
  suggestion?: string
  attachments?: string[]
}

export type AbnormalHandleAction =
  | 'redispatch'
  | 'manual_intervene'
  | 'circuit_break'
  | 'compensate'
  | 'review'

export type CompensationPlan = 'coupon' | 'refund' | 'exchange' | 'none'
