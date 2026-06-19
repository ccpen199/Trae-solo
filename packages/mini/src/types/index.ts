export interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  role: string;
}

export interface CommunityInfo {
  id: string;
  name: string;
  address: string;
}

export interface HouseInfo {
  id: string;
  communityId: string;
  communityName: string;
  buildingName: string;
  unitName: string;
  roomNumber: string;
  relationship: string;
  isVerified: boolean;
}

export interface AccessDevice {
  id: string;
  name: string;
  type: string;
  location: string;
  isOnline: boolean;
}

export interface AccessLog {
  id: string;
  deviceName: string;
  location: string;
  accessType: string;
  accessResult: boolean;
  accessedAt: string;
}

export interface TicketItem {
  id: string;
  type: 'REPAIR' | 'COMPLAINT' | 'SUGGESTION';
  title: string;
  content: string;
  status: 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'COMPLETED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  completedAt?: string;
  handlerName?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  sort: number;
}

export interface ServiceItem {
  id: string;
  providerId: string;
  providerName: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  unit: string;
  sales: number;
  rating: number;
  ratingCount: number;
}

export interface ServiceOrder {
  id: string;
  orderNo: string;
  serviceName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface QuickFeature {
  id: string;
  name: string;
  icon: string;
  page: string;
  color: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  type: 'NOTICE' | 'ACTIVITY' | 'WARNING';
}
