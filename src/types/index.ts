export interface Store {
  id: string;
  name: string;
  type: 'esports' | 'hotel' | 'both';
  address: string;
  area: number;
  seatCount: number;
  roomCount: number;
  status: 'open' | 'closed' | 'maintenance';
  createdAt: string;
}

export interface Seat {
  id: string;
  storeId: string;
  seatNumber: string;
  area: string;
  row: number;
  col: number;
  deviceId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  pricePerHour: number;
  networkLatency: number;
}

export interface Room {
  id: string;
  storeId: string;
  name: string;
  type: 'standard' | 'deluxe' | 'vip' | 'presidential';
  capacity: number;
  area: number;
  deviceIds: string[];
  pricePerHour: number;
  pricePerNight: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  facilities: string[];
  image: string;
}

export interface Device {
  id: string;
  storeId: string;
  name: string;
  model: string;
  type: 'pc' | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'network';
  specs: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    monitorSize?: string;
    refreshRate?: number;
  };
  status: 'normal' | 'warning' | 'fault' | 'offline';
  location: string;
  lastMaintenance: string;
  temperature?: number;
  frameRate?: number;
  networkLatency?: number;
}

export interface BookingOrder {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  seatId: string;
  seatNumber: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface HotelBooking {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  guestName: string;
  guestPhone: string;
  deviceLocked: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  level: number;
  levelName: string;
  points: number;
  totalSpent: number;
  totalVisits: number;
  rank: string;
  registrationDate: string;
  lastVisit: string;
}

export interface MemberLevel {
  level: number;
  name: string;
  minPoints: number;
  benefits: string[];
  discount: number;
  icon: string;
}

export interface DeviceStatus {
  deviceId: string;
  temperature: number;
  frameRate: number;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  uptime: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  storeId: string;
  storeName: string;
  type: 'temperature' | 'performance' | 'network' | 'hardware';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'pending' | 'processing' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  handler?: string;
}

export interface Tournament {
  id: string;
  name: string;
  game: string;
  type: 'online' | 'offline' | 'hybrid';
  status: 'upcoming' | 'registration' | 'ongoing' | 'finished';
  startTime: string;
  endTime: string;
  prizePool: number;
  maxTeams: number;
  registeredTeams: number;
  location?: string;
  coverImage: string;
  description: string;
}

export interface LiveStream {
  id: string;
  title: string;
  game: string;
  streamer: string;
  viewers: number;
  status: 'live' | 'offline' | 'scheduled';
  thumbnail: string;
  startTime: string;
}

export interface Team {
  id: string;
  name: string;
  game: string;
  leader: string;
  members: number;
  maxMembers: number;
  rating: number;
  logo: string;
  status: 'recruiting' | 'full';
  description: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  pointsCost: number;
  stock: number;
  image: string;
  description: string;
  type: 'peripheral' | 'time' | 'ticket' | 'food';
}

export interface MallOrder {
  id: string;
  userId: string;
  userName: string;
  products: { productId: string; productName: string; quantity: number; price: number }[];
  totalAmount: number;
  pointsUsed: number;
  fulfillmentType: 'pickup' | 'delivery';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  address?: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
}

export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  repurchaseRate: number;
  deviceUsageRate: number;
  spaceEfficiency: number;
  activeMembers: number;
  newMembers: number;
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface DeviceUsageItem {
  hour: string;
  usage: number;
  revenue: number;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  memberName: string;
  type: 'earn' | 'spend' | 'adjust' | 'refund';
  points: number;
  balance: number;
  source: string;
  sourceId?: string;
  description: string;
  operatorId?: string;
  operatorName?: string;
  createdAt: string;
}

export interface TournamentParticipation {
  id: string;
  memberId: string;
  memberName: string;
  tournamentId: string;
  tournamentName: string;
  teamName?: string;
  role: 'player' | 'substitute' | 'spectator';
  registrationTime: string;
  status: 'registered' | 'confirmed' | 'eliminated' | 'finished';
  finalRank?: number;
  prizePoints?: number;
  checkInTime?: string;
}

export interface ExchangeRecord {
  id: string;
  memberId: string;
  memberName: string;
  productId: string;
  productName: string;
  productType: 'peripheral' | 'time' | 'ticket' | 'food';
  pointsUsed: number;
  amountPaid?: number;
  quantity: number;
  status: 'pending' | 'confirmed' | 'fulfilled' | 'redeemed' | 'cancelled' | 'expired';
  fulfillmentType: 'pickup' | 'delivery' | 'virtual';
  storeId?: string;
  storeName?: string;
  address?: string;
  trackingNumber?: string;
  redemptionCode?: string;
  createdAt: string;
  confirmedAt?: string;
  fulfilledAt?: string;
  redeemedAt?: string;
  operatorId?: string;
  operatorName?: string;
  auditTrail: {
    status: string;
    timestamp: string;
    operator?: string;
    note?: string;
  }[];
}

export interface AlertHandlingRecord {
  id: string;
  alertId: string;
  action: 'create' | 'assign' | 'start' | 'escalate' | 'resolve' | 'reopen' | 'close' | 'review';
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  note?: string;
  beforeStatus?: string;
  afterStatus?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  type: 'in' | 'out' | 'adjust' | 'transfer_in' | 'transfer_out' | 'return';
  quantity: number;
  beforeStock: number;
  afterStock: number;
  referenceId?: string;
  referenceType?: string;
  operatorId: string;
  operatorName: string;
  note?: string;
  createdAt: string;
}

export interface FulfillmentTrack {
  id: string;
  orderId: string;
  status: 'pending' | 'confirmed' | 'picking' | 'picked' | 'packing' | 'packed' | 'shipping' | 'delivered' | 'pickup_ready' | 'picked_up' | 'cancelled';
  fulfillmentType: 'pickup' | 'same_city' | 'standard';
  location?: string;
  description: string;
  operatorId?: string;
  operatorName?: string;
  courierName?: string;
  courierPhone?: string;
  trackingNumber?: string;
  estimatedTime?: string;
  createdAt: string;
}

export interface BIReport {
  id: string;
  name: string;
  category: 'revenue' | 'operations' | 'members' | 'devices' | 'inventory';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  status: 'generating' | 'ready' | 'expired' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  filters?: Record<string, any>;
  summary: {
    key: string;
    label: string;
    value: number | string;
    unit?: string;
    trend?: number;
  }[];
}

export interface StoreComparison {
  storeId: string;
  storeName: string;
  storeType: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  deviceUsageRate: number;
  spaceEfficiency: number;
  newMembers: number;
  activeMembers: number;
  repurchaseRate: number;
  alertCount: number;
}

export interface TimeSegmentData {
  period: string;
  segment: string;
  revenue: number;
  orders: number;
  avgDuration: number;
  peakUsers: number;
  deviceUsage: number;
}

export interface BookingTrack {
  id: string;
  bookingId: string;
  status: 'created' | 'confirmed' | 'checked_in' | 'in_progress' | 'paused' | 'extended' | 'completed' | 'cancelled' | 'no_show';
  operatorId?: string;
  operatorName?: string;
  description: string;
  note?: string;
  createdAt: string;
}

export interface DeviceLockRecord {
  id: string;
  hotelBookingId: string;
  roomId: string;
  roomName: string;
  deviceId: string;
  deviceName: string;
  action: 'lock' | 'unlock' | 'extend' | 'force_unlock';
  operatorId: string;
  operatorName: string;
  reason?: string;
  lockedAt?: string;
  unlockedAt?: string;
  createdAt: string;
}

export interface SeatMapData {
  id: string;
  seatNumber: string;
  row: number;
  col: number;
  area: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  deviceId: string;
  deviceSpec: string;
  networkLatency: number;
  pricePerHour: number;
  currentUserId?: string;
  currentUserName?: string;
  bookingEndTime?: string;
}

export interface RoomDeviceMap {
  roomId: string;
  roomName: string;
  roomType: string;
  storeId: string;
  storeName: string;
  isHotel: boolean;
  deviceIds: string[];
  devices: {
    id: string;
    name: string;
    model: string;
    type: string;
    status: string;
  }[];
  status: string;
  capacity: number;
}

