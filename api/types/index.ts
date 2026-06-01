export interface User {
  id: number
  phone: string
  name: string
  role: 'personal' | 'merchant' | 'enterprise' | 'customer_service' | 'manager' | 'admin'
  company?: string
  created_at: string
}

export interface Order {
  id: number
  order_no: string
  tracking_no?: string
  user_id: number
  sender_name: string
  sender_phone: string
  sender_address: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  goods_type: string
  weight: number
  urgency: 'standard' | 'express' | 'urgent'
  routing_plan?: string
  carrier?: string
  estimated_delivery?: string
  cost?: number
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'
  created_at: string
  updated_at: string
}

export interface TrackingEvent {
  id: number
  order_id: number
  location: string
  description: string
  status: string
  event_type?: string
  event_time: string
  created_at?: string
  operator?: string
  remark?: string
}

export interface Exception {
  id: number
  order_id: number
  type: string
  exception_type?: string
  level: number
  description: string
  response_status: 'alert' | 'called' | 'manager_intervened' | 'resolved'
  responder_id?: number
  operator?: string
  response_note?: string
  responded_at?: string
  receiver_name?: string
  receiver_phone?: string
  tracking_no?: string
  order_no?: string
  resolved_at?: string
  detected_at: string
  created_at?: string
}

export type ExceptionOrder = Exception

export interface ExpressOrder {
  id: number
  order_no: string
  user_id: number
  rider_id?: number
  protocol_id?: number
  pickup_address: string
  delivery_address: string
  special_items?: string
  status: 'pending' | 'assigned' | 'picked_up' | 'delivering' | 'delivered'
  estimated_minutes?: number
  created_at: string
}

export interface Rider {
  id: number
  name: string
  phone: string
  latitude: number
  longitude: number
  status: 'available' | 'busy' | 'offline'
  updated_at: string
}

export interface Provider {
  id: number
  name: string
  service_area: string
  rating: number
  services: string
  contact: string
  booked_count: number
}

export interface BulkOrder {
  id: number
  order_no: string
  user_id: number
  provider_id?: number
  item_desc: string
  floors: number
  has_elevator: number
  floor_height?: number
  disassembly_required: number
  fee: number
  status: 'pending' | 'assigned' | 'in_progress' | 'completed'
  created_at: string
}

export interface Network {
  id: number
  name: string
  city: string
  latitude: number
  longitude: number
  throughput: number
  capacity: number
  status: 'normal' | 'busy' | 'overloaded'
}

export interface Vehicle {
  id: number
  network_id: number
  plate: string
  latitude: number
  longitude: number
  status: 'in_transit' | 'loading' | 'unloading' | 'idle'
  route?: string
}

export interface Protocol {
  id: number
  name: string
  category: string
  requirements: string
  temperature_range?: string
  container_spec?: string
  active: number
}

export interface DecryptRequest {
  id: number
  user_id: number
  admin_id?: number
  target_type: string
  target_id: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expires_at?: string
  created_at: string
}

export interface AuditLog {
  id: number
  admin_id: number
  action: string
  target: string
  detail?: string
  created_at: string
}

export interface AdminUser {
  id: number
  username: string
  name: string
  role: string
  created_at: string
}

export interface RoutingOption {
  carrier: string
  estimated_days: number
  cost: number
  score: number
  reason: string
}
