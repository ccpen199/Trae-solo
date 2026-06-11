export type PileType = '两轮' | '三轮' | '四轮'
export type PileStatus = '充电中' | '空闲' | '故障' | '离线'
export type PortStatus = '充电中' | '空闲' | '故障' | '已占用'
export type OrderStatus = '充电中' | '已完成' | '异常终止'
export type StartMethod = '扫码' | '蓝牙' | 'NFC'
export type AlertType = '过载' | '高温' | '断连' | '拔枪'
export type AlertSeverity = '紧急' | '重要' | '一般'
export type AlertStatus = '待处理' | '已处理'
export type UserStatus = '正常' | '降权' | '黑名单'
export type UpgradeStatus = '升级中' | '成功' | '失败'
export type StationStatus = '运营中' | '维护中' | '已关闭'
export type TimePeriod = '峰时' | '平时' | '谷时'

export interface Station {
  station_id: string
  name: string
  longitude: number
  latitude: number
  address: string
  region: string
  total_piles: number
  status: StationStatus
  property_owner: string
  fault_count: number
}

export interface ChargingPile {
  pile_id: string
  station_id: string
  pile_type: PileType
  model: string
  firmware_version: string
  online_rate: number
  status: PileStatus
  health_score: number
  station_name?: string
  gbt_connected: boolean
  last_heartbeat: string
}

export interface ChargingPort {
  port_id: string
  pile_id: string
  port_number: number
  status: PortStatus
  max_power: number
  current_power: number
}

export interface User {
  user_id: string
  phone: string
  nickname: string
  credit_score: number
  charge_count: number
  status: UserStatus
  last_active: string
}

export interface ChargingOrder {
  order_id: string
  user_id: string
  port_id: string
  pile_id: string
  station_id: string
  start_time: string
  end_time: string
  energy_kwh: number
  total_amount: number
  status: OrderStatus
  start_method: StartMethod
  user_nickname?: string
  pile_id_display?: string
  abort_reason?: string
  settlement_status: '待结算' | '已结算' | '退款中'
  refund_amount?: number
}

export interface BillingDetail {
  order_id: string
  peak_energy: number
  flat_energy: number
  valley_energy: number
  peak_price: number
  flat_price: number
  valley_price: number
  service_fee: number
  total_electric_fee: number
  total_amount: number
}

export interface AlertRecord {
  alert_id: string
  pile_id: string
  order_id: string
  alert_type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  triggered_at: string
  description: string
  snapshot_json: string
}

export interface SettlementDetail {
  settlement_id: string
  order_id: string
  total_amount: number
  grid_share: number
  property_share: number
  operator_share: number
  grid_rule: string
  property_rule: string
  settled_at: string
}

export interface FirmwareUpgrade {
  upgrade_id: string
  pile_id: string
  from_version: string
  to_version: string
  status: UpgradeStatus
  started_at: string
  completed_at: string
}

export interface CreditRecord {
  record_id: string
  user_id: string
  score_change: number
  reason: string
  rule_id: string
  created_at: string
}

export interface PricingRule {
  period: TimePeriod
  start_hour: number
  end_hour: number
  price: number
  service_fee: number
}

export interface ProfitRule {
  id: string
  name: string
  grid_ratio: number
  property_ratio: number
  operator_ratio: number
  min_amount?: number
  max_amount?: number
}

export interface SafetyConfig {
  max_charge_hours: number
  max_power_w: number
  temp_threshold_c: number
  overload_threshold_w: number
  disconnect_timeout_s: number
}
