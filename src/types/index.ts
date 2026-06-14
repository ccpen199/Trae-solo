export type UserRole = 'resident' | 'property' | 'committee';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: UserRole;
  properties: Property[];
  currentPropertyId: string;
}

export interface Property {
  id: string;
  building: string;
  unit: string;
  room: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  members: Resident[];
  permissionLevel: 'building' | 'unit' | 'room';
}

export interface Resident {
  id: string;
  name: string;
  phone: string;
  relation: string;
  permission: 'owner' | 'family' | 'tenant';
}

export interface AccessDevice {
  id: string;
  name: string;
  location: string;
  type: 'bluetooth' | 'nfc' | 'qrcode' | 'combo';
  status: 'online' | 'offline' | 'fault';
  lastOnline: string;
  batteryLevel?: number;
  buildingScope: string[];
}

export interface AccessLog {
  id: string;
  deviceId: string;
  deviceName: string;
  userId: string;
  userName: string;
  method: 'bluetooth' | 'nfc' | 'qrcode' | 'card';
  result: 'success' | 'fail';
  timestamp: string;
  failReason?: string;
}

export interface AccessAuth {
  id: string;
  userId: string;
  userName: string;
  deviceIds: string[];
  validFrom: string;
  validTo: string;
  grantedBy: string;
  grantedAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface VisitorInvite {
  id: string;
  inviterId: string;
  inviterName: string;
  visitorName: string;
  visitorPhone: string;
  qrCode: string;
  validFrom: string;
  validTo: string;
  deviceIds: string[];
  used: boolean;
  usedAt?: string;
  createdAt: string;
}

export type TicketType = 'repair' | 'complaint' | 'suggestion';
export type TicketStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'closed';

export interface Ticket {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  images: string[];
  location: string;
  contactName: string;
  contactPhone: string;
  submitterId: string;
  submitterName: string;
  handlerId?: string;
  handlerName?: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  responseMinutes?: number;
  handleMinutes?: number;
  satisfaction?: number;
  comment?: string;
  progress: TicketProgress[];
}

export interface TicketProgress {
  id: string;
  status: TicketStatus;
  operator: string;
  remark: string;
  timestamp: string;
  images?: string[];
}

export type ServiceCategory = 'housekeeping' | 'delivery' | 'groupbuy' | 'mall' | 'maintenance';

export interface ServiceProvider {
  id: string;
  name: string;
  logo: string;
  category: ServiceCategory;
  rating: number;
  orderCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'frozen';
  commissionRate: number;
  description: string;
  contactName: string;
  contactPhone: string;
  applyTime: string;
  approvedTime?: string;
}

export interface ServiceItem {
  id: string;
  providerId: string;
  providerName: string;
  category: ServiceCategory;
  title: string;
  cover: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sales: number;
  description: string;
  tags: string[];
  status: 'on' | 'off';
}

export interface Product {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  title: string;
  cover: string;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  sales: number;
  rating: number;
  description: string;
  tags: string[];
}

export interface GroupBuy {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  cover: string;
  price: number;
  originalPrice: number;
  minCount: number;
  currentCount: number;
  endTime: string;
  description: string;
  status: 'active' | 'ended' | 'full';
}

export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'servicing' | 'completed' | 'cancelled' | 'refunding';

export interface Order {
  id: string;
  orderNo: string;
  type: 'service' | 'product' | 'groupbuy';
  itemId: string;
  itemTitle: string;
  itemCover: string;
  providerId: string;
  providerName: string;
  amount: number;
  commission: number;
  quantity: number;
  status: OrderStatus;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  address?: string;
  appointmentTime?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  rating?: number;
  comment?: string;
}

export interface LockerBox {
  id: string;
  code: string;
  size: 'small' | 'medium' | 'large';
  status: 'empty' | 'occupied';
  expressCompany?: string;
  pickupCode?: string;
  storedAt?: string;
  expireAt?: string;
}

export interface KpiData {
  period: string;
  avgResponseMinutes: number;
  avgHandleMinutes: number;
  completionRate: number;
  satisfaction: number;
  totalTickets: number;
  repairTickets: number;
  complaintTickets: number;
  suggestionTickets: number;
  onTimeRate: number;
}

export interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceLocation: string;
  level: 'info' | 'warning' | 'critical';
  type: 'offline' | 'low_battery' | 'fault' | 'tamper';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Notification {
  id: string;
  type: 'system' | 'ticket' | 'service' | 'access' | 'payment';
  title: string;
  content: string;
  read: boolean;
  timestamp: string;
  relateId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  cover?: string;
  publisher: string;
  publishTime: string;
  level: 'normal' | 'important' | 'urgent';
  targetBuilding?: string[];
}
