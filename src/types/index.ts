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
