export interface Appointment {
  id: string;
  supplierId: string;
  supplierName: string;
  arrivalTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface InboundOrder {
  id: string;
  appointmentId: string;
  supplierId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboundItem {
  id: string;
  inboundOrderId: string;
  sku: string;
  productName: string;
  quantity: number;
  qualityStatus: 'pass' | 'fail' | 'pending';
  locationId?: string;
  createdAt: string;
}

export interface OutboundOrder {
  id: string;
  orderId: string;
  customerId: string;
  status: 'pending' | 'processing' | 'picked' | 'packed' | 'shipped' | 'cancelled';
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundItem {
  id: string;
  outboundOrderId: string;
  sku: string;
  productName: string;
  quantity: number;
  locationId: string;
  status: 'pending' | 'picked' | 'packed' | 'shipped';
  createdAt: string;
}

export interface Inventory {
  id: string;
  sku: string;
  locationId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  status: 'normal' | 'frozen' | 'damaged' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  code: string;
  type: 'shelf' | 'bin' | 'pallet';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  createdAt: string;
}

export interface WavePick {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalOrders: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface WavePickItem {
  id: string;
  wavePickId: string;
  outboundItemId: string;
  locationId: string;
  quantity: number;
  status: 'pending' | 'picked';
  createdAt: string;
}

export interface InventoryAudit {
  id: string;
  auditType: 'cycle' | 'dynamic';
  status: 'pending' | 'processing' | 'completed';
  startTime: string;
  endTime?: string;
  totalItems: number;
  discrepancyItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditItem {
  id: string;
  auditId: string;
  sku: string;
  locationId: string;
  systemQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  status: 'matched' | 'discrepancy' | 'resolved';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'warehouse_manager' | 'receiver' | 'picker' | 'checker';
  createdAt: string;
}

export interface Log {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}