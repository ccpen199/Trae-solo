import type { Request } from 'express';

export interface Community {
  id: number;
  name: string;
  subdomain: string;
  address: string;
  lat: number;
  lng: number;
  created_at: string;
}

export type ResidentRole = 'resident' | 'property_admin' | 'platform_admin';

export interface Resident {
  id: number;
  community_id: number;
  real_name: string;
  phone: string;
  id_card_hash: string | null;
  access_card_id: string | null;
  unit_building: string | null;
  unit_number: string | null;
  role: ResidentRole;
  saml_id: string | null;
  status: string;
  created_at: string;
}

export type TopicCategory = 'discussion' | 'secondhand' | 'activity' | 'complaint';

export interface Topic {
  id: number;
  community_id: number;
  resident_id: number;
  title: string;
  content: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_label: string | null;
  category: TopicCategory;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_filtered: number;
  filter_reason: string | null;
  status: string;
  created_at: string;
}

export interface TopicComment {
  id: number;
  topic_id: number;
  resident_id: number;
  content: string;
  is_filtered: number;
  created_at: string;
}

export interface Sku {
  id: number;
  community_id: number;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  images: string;
  category: string;
  lat: number | null;
  lng: number | null;
  radius_km: number;
  stock_self: number;
  stock_property: number;
  is_self_operated: number;
  status: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'confirmed' | 'refunded';
export type EscrowStatus = 'held' | 'released' | 'refunded';

export interface Order {
  id: number;
  community_id: number;
  buyer_id: number;
  seller_id: number | null;
  sku_id: number;
  quantity: number;
  total_amount: number;
  status: OrderStatus;
  escrow_status: EscrowStatus;
  payment_method: string | null;
  shipping_address: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Wallet {
  id: number;
  resident_id: number;
  balance: number;
  frozen_amount: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
}

export type WalletTransactionType = 'earning' | 'withdrawal' | 'red_packet' | 'escrow_in' | 'escrow_out' | 'refund';

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: WalletTransactionType;
  amount: number;
  ref_type: string | null;
  ref_id: number | null;
  description: string | null;
  created_at: string;
}

export type TaskType = 'check_in' | 'invite' | 'review' | 'first_post';

export interface Task {
  id: number;
  community_id: number;
  type: TaskType;
  title: string;
  description: string;
  reward_amount: number;
  daily_limit: number;
  status: string;
  created_at: string;
}

export interface TaskCompletion {
  id: number;
  task_id: number;
  resident_id: number;
  reward_amount: number;
  created_at: string;
}

export type RedPacketStatus = 'pending' | 'issued' | 'claimed' | 'expired';

export interface RedPacket {
  id: number;
  community_id: number;
  resident_id: number;
  amount: number;
  reason: string;
  status: RedPacketStatus;
  expires_at: string;
  created_at: string;
}

export interface Partner {
  id: number;
  community_id: number;
  resident_id: number;
  shop_name: string;
  shop_type: string;
  commission_rate: number;
  parent_partner_id: number | null;
  level: number;
  total_earnings: number;
  status: string;
  created_at: string;
}

export type PartnerSettlementStatus = 'pending' | 'settled';

export interface PartnerSettlement {
  id: number;
  partner_id: number;
  order_id: number;
  amount: number;
  level: number;
  status: PartnerSettlementStatus;
  created_at: string;
  settled_at: string | null;
}

export type PropertyServiceType = 'access_control' | 'payment' | 'repair';

export interface PropertyService {
  id: number;
  community_id: number;
  resident_id: number;
  type: PropertyServiceType;
  title: string;
  description: string;
  status: string;
  external_ref: string | null;
  response_data: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface FraudLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  actor_id: number | null;
  actor_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  detail: string | null;
  created_at: string;
}

export type RiskControlRuleType = 'daily_withdraw_limit' | 'anti_money_laundering' | 'frequency_limit';

export interface RiskControl {
  id: number;
  resident_id: number;
  rule_type: RiskControlRuleType;
  rule_value: string;
  is_triggered: number;
  triggered_at: string | null;
  created_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: Resident;
  community?: Community;
}
