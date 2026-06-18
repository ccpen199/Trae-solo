import { create } from "zustand";

export interface StatData {
  todayTransaction: number;
  activeUsers: number;
  totalDeposits: number;
  partners: number;
  totalValue: number;
  todayRedemption: number;
}

export interface TransactionItem {
  id: string;
  action: string;
  amount: number;
  party: string;
  time: string;
  status: "success" | "pending" | "failed";
}

export interface VolumeData {
  date: string;
  value: number;
}

export interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

export interface ExpiringBenefit {
  id: string;
  name: string;
  expireDate: string;
  daysLeft: number;
  level: "red" | "yellow" | "green";
  value: number;
}

export interface PointAccount {
  id: string;
  sourceName: string;
  balance: number;
  expireSoon: number;
  unit: string;
  valuation: number;
  color: string;
  trend: number[];
}

export interface ExchangeRecord {
  orderNo: string;
  benefitName: string;
  pointsDeducted: number;
  cash: number;
  status: "completed" | "processing" | "failed";
  time: string;
}

export interface MarketBenefit {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  cash: number;
  stock: number;
  rating: number;
  isHot: boolean;
  icon: string;
}

export interface DashboardData {
  stats: StatData;
  transactionList: TransactionItem[];
  volume7d: VolumeData[];
  radarData: RadarData[];
  expiringSoon: ExpiringBenefit[];
}

export interface HolderData {
  totalValuation: number;
  available: number;
  frozen: number;
  expiringSoon: number;
  accounts: PointAccount[];
  exchangeRecords: ExchangeRecord[];
}

export interface AppState {
  dashboard: DashboardData;
  holder: HolderData;
  market: MarketBenefit[];
}

const mockDashboard: DashboardData = {
  stats: {
    todayTransaction: 12847,
    activeUsers: 8942,
    totalDeposits: 1256830,
    partners: 86,
    totalValue: 9856420,
    todayRedemption: 3241,
  },
  transactionList: [
    { id: "1", action: "权益兑换", amount: 580, party: "平安银行", time: "10:32:15", status: "success" },
    { id: "2", action: "积分存证", amount: 2400, party: "南方航空", time: "10:31:48", status: "success" },
    { id: "3", action: "权益核销", amount: 150, party: "中国移动", time: "10:30:22", status: "pending" },
    { id: "4", action: "分润结算", amount: 3200, party: "太平洋保险", time: "10:29:56", status: "success" },
    { id: "5", action: "权益兑换", amount: 890, party: "招商银行", time: "10:28:33", status: "failed" },
    { id: "6", action: "积分存证", amount: 1800, party: "东方航空", time: "10:27:12", status: "success" },
    { id: "7", action: "权益核销", amount: 320, party: "中国联通", time: "10:26:45", status: "success" },
    { id: "8", action: "分润结算", amount: 5600, party: "中国人寿", time: "10:25:18", status: "success" },
    { id: "9", action: "权益兑换", amount: 1200, party: "工商银行", time: "10:24:02", status: "pending" },
    { id: "10", action: "积分存证", amount: 950, party: "海南航空", time: "10:23:31", status: "success" },
  ],
  volume7d: [
    { date: "06-11", value: 8520 },
    { date: "06-12", value: 9240 },
    { date: "06-13", value: 7890 },
    { date: "06-14", value: 11250 },
    { date: "06-15", value: 10680 },
    { date: "06-16", value: 12400 },
    { date: "06-17", value: 12847 },
  ],
  radarData: [
    { subject: "过期率", value: 78, fullMark: 100 },
    { subject: "兑换率", value: 85, fullMark: 100 },
    { subject: "核销率", value: 72, fullMark: 100 },
    { subject: "活跃度", value: 90, fullMark: 100 },
    { subject: "分润完成度", value: 68, fullMark: 100 },
  ],
  expiringSoon: [
    { id: "e1", name: "星巴克中杯咖啡券", expireDate: "2026-06-19", daysLeft: 2, level: "red", value: 38 },
    { id: "e2", name: "京东E卡100元", expireDate: "2026-06-22", daysLeft: 5, level: "red", value: 100 },
    { id: "e3", name: "滴滴出行券50元", expireDate: "2026-06-27", daysLeft: 10, level: "yellow", value: 50 },
    { id: "e4", name: "爱奇艺月卡", expireDate: "2026-07-05", daysLeft: 18, level: "yellow", value: 25 },
    { id: "e5", name: "盒马鲜生200元券", expireDate: "2026-07-20", daysLeft: 33, level: "green", value: 200 },
  ],
};

const mockHolder: HolderData = {
  totalValuation: 128560,
  available: 98420,
  frozen: 12800,
  expiringSoon: 17340,
  accounts: [
    {
      id: "a1",
      sourceName: "太平洋保险",
      balance: 56800,
      expireSoon: 8200,
      unit: "积分",
      valuation: 5680,
      color: "insurance",
      trend: [320, 380, 350, 420, 400, 480, 520],
    },
    {
      id: "a2",
      sourceName: "招商银行",
      balance: 128500,
      expireSoon: 5600,
      unit: "积分",
      valuation: 25700,
      color: "bank",
      trend: [800, 820, 780, 900, 950, 880, 920],
    },
    {
      id: "a3",
      sourceName: "南方航空",
      balance: 42000,
      expireSoon: 3540,
      unit: "里程",
      valuation: 84000,
      color: "airline",
      trend: [200, 220, 250, 230, 280, 300, 320],
    },
    {
      id: "a4",
      sourceName: "中国移动",
      balance: 8600,
      expireSoon: 0,
      unit: "积分",
      valuation: 13180,
      color: "telecom",
      trend: [60, 58, 65, 70, 72, 68, 75],
    },
  ],
  exchangeRecords: [
    { orderNo: "ORD202606170001", benefitName: "星巴克中杯咖啡券", pointsDeducted: 580, cash: 0, status: "completed", time: "2026-06-17 09:32:15" },
    { orderNo: "ORD202606160023", benefitName: "京东E卡100元", pointsDeducted: 2400, cash: 10, status: "completed", time: "2026-06-16 18:45:22" },
    { orderNo: "ORD202606160018", benefitName: "滴滴出行券50元", pointsDeducted: 1200, cash: 0, status: "processing", time: "2026-06-16 14:22:08" },
    { orderNo: "ORD202606150045", benefitName: "爱奇艺黄金会员季卡", pointsDeducted: 3600, cash: 0, status: "completed", time: "2026-06-15 20:15:46" },
    { orderNo: "ORD202606140032", benefitName: "盒马鲜生200元券", pointsDeducted: 8800, cash: 20, status: "failed", time: "2026-06-14 11:08:33" },
    { orderNo: "ORD202606130019", benefitName: "肯德基全家桶", pointsDeducted: 3200, cash: 0, status: "completed", time: "2026-06-13 19:30:12" },
  ],
};

const mockMarket: MarketBenefit[] = [
  { id: "m1", name: "星巴克中杯咖啡券", description: "全场中杯手调饮品任选一杯", category: "餐饮美食", points: 580, cash: 0, stock: 1280, rating: 4.8, isHot: true, icon: "Coffee" },
  { id: "m2", name: "京东E卡100元", description: "京东商城全场通用，无门槛使用", category: "生活服务", points: 2400, cash: 10, stock: 856, rating: 4.9, isHot: true, icon: "ShoppingBag" },
  { id: "m3", name: "滴滴出行券50元", description: "滴滴快车/专车通用抵扣券", category: "旅行出行", points: 1200, cash: 0, stock: 2340, rating: 4.6, isHot: false, icon: "Car" },
  { id: "m4", name: "爱奇艺黄金会员月卡", description: "爱奇艺VIP黄金会员，畅享热门剧集", category: "生活服务", points: 1280, cash: 0, stock: 3200, rating: 4.7, isHot: true, icon: "PlayCircle" },
  { id: "m5", name: "盒马鲜生200元券", description: "盒马鲜生门店/APP全场通用", category: "生活服务", points: 8800, cash: 20, stock: 420, rating: 4.9, isHot: false, icon: "ShoppingCart" },
  { id: "m6", name: "肯德基全家桶套餐", description: "肯德基经典全家桶，满足一家人", category: "餐饮美食", points: 3200, cash: 0, stock: 680, rating: 4.5, isHot: false, icon: "Hamburger" },
  { id: "m7", name: "AirPods Pro 2代", description: "苹果主动降噪无线蓝牙耳机", category: "数码家电", points: 18600, cash: 299, stock: 56, rating: 4.9, isHot: true, icon: "Headphones" },
  { id: "m8", name: "南航国内航线机票券", description: "南方航空国内航线200元抵扣券", category: "旅行出行", points: 5600, cash: 0, stock: 180, rating: 4.7, isHot: false, icon: "Airplane" },
  { id: "m9", name: "小米扫地机器人", description: "米家扫拖一体机器人，智能清洁", category: "数码家电", points: 12800, cash: 199, stock: 128, rating: 4.6, isHot: false, icon: "Vacuum" },
  { id: "m10", name: "太平洋保险意外险", description: "一年期综合意外险，保额50万", category: "金融服务", points: 1800, cash: 0, stock: 5000, rating: 4.4, isHot: false, icon: "ShieldCheck" },
  { id: "m11", name: "麦当劳麦辣鸡腿堡", description: "麦当劳经典麦辣鸡腿堡单人餐", category: "餐饮美食", points: 880, cash: 0, stock: 4200, rating: 4.3, isHot: false, icon: "Sandwich" },
  { id: "m12", name: "高铁贵宾厅服务", description: "全国高铁站贵宾厅单次使用权益", category: "旅行出行", points: 1600, cash: 0, stock: 890, rating: 4.5, isHot: true, icon: "Train" },
];

export const useAppStore = create<AppState>(() => ({
  dashboard: mockDashboard,
  holder: mockHolder,
  market: mockMarket,
}));
