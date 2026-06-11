export type WaybillStatus = 
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'pending_delivery'
  | 'delivering'
  | 'delivered'
  | 'station_received'
  | 'exception'
  | 'archived';

export type WaybillType = 'standard' | 'express' | 'fragile' | 'valuable' | 'perishable';

export interface Receiver {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  longitude?: number;
  latitude?: number;
}

export interface Sender {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
}

export interface OperationLog {
  id: string;
  waybillNo: string;
  operatorId: string;
  operatorName: string;
  operation: string;
  operationType: 'pickup' | 'delivery' | 'scan' | 'exception' | 'sign' | 'archive';
  location?: string;
  longitude?: number;
  latitude?: number;
  deviceInfo?: string;
  ip?: string;
  timestamp: number;
  remark?: string;
}

export interface ElectronicSignature {
  signerName: string;
  signerIdCard: string;
  signatureImg?: string;
  timestamp: number;
  location?: string;
}

export interface Waybill {
  id: string;
  waybillNo: string;
  type: WaybillType;
  status: WaybillStatus;
  sender: Sender;
  receiver: Receiver;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  goodsDescription: string;
  goodsValue?: number;
  freight?: number;
  paymentMethod: 'sender_pay' | 'receiver_pay' | 'monthly';
  expectedPickupTime?: number;
  actualPickupTime?: number;
  expectedDeliveryTime?: number;
  actualDeliveryTime?: number;
  stationId?: string;
  stationName?: string;
  courierId?: string;
  courierName?: string;
  isOfflineCreated?: boolean;
  syncedToCainiao?: boolean;
  cainiaoSyncTime?: number;
  archived?: boolean;
  archiveTime?: number;
  evidenceHash?: string;
  operationLogs: OperationLog[];
  electronicSignature?: ElectronicSignature;
  createTime: number;
  updateTime: number;
}

export interface PickupTask {
  id: string;
  waybillNo: string;
  waybill?: Waybill;
  sender: Sender;
  goodsDescription: string;
  expectedPickupTime: number;
  latestPickupTime: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'cancelled';
  priority: 'normal' | 'urgent' | 'vip';
  assignTime: number;
  acceptTime?: number;
  pickupTime?: number;
  remark?: string;
}

export interface DeliveryTask {
  id: string;
  waybillNo: string;
  waybill?: Waybill;
  receiver: Receiver;
  goodsDescription: string;
  expectedDeliveryTime: number;
  latestDeliveryTime: number;
  status: 'pending' | 'delivering' | 'delivered' | 'station' | 'exception';
  deliveryAttempts: number;
  assignTime: number;
  startTime?: number;
  deliveredTime?: number;
  stationId?: string;
  stationName?: string;
  remark?: string;
}

export const WAYBILL_STATUS_MAP: Record<WaybillStatus, string> = {
  pending_pickup: '待揽收',
  picked_up: '已揽收',
  in_transit: '运输中',
  pending_delivery: '待派送',
  delivering: '派送中',
  delivered: '已签收',
  station_received: '驿站代收',
  exception: '异常件',
  archived: '已归档'
};

export const WAYBILL_TYPE_MAP: Record<WaybillType, string> = {
  standard: '标准件',
  express: '特快件',
  fragile: '易碎品',
  valuable: '贵重品',
  perishable: '生鲜品'
};
