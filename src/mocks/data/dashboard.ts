import type { DashboardStats, WorkOrder, Activity, Product } from '@/types/entity';
import type { HeatmapDataPoint } from '@/components/business/HeatmapChart';
import dayjs from 'dayjs';

export const mockDashboardStats: DashboardStats = {
  totalResidents: 1258,
  totalWorkOrders: 326,
  pendingWorkOrders: 28,
  todayWorkOrders: 12,
  totalBills: 2580,
  unpaidBills: 186,
  unpaidAmount: 58600,
  totalActivities: 48,
  ongoingActivities: 5,
  slaWarningCount: 3,
  workOrderTrend: [
    { date: '周一', count: 18 },
    { date: '周二', count: 25 },
    { date: '周三', count: 22 },
    { date: '周四', count: 30 },
    { date: '周五', count: 28 },
    { date: '周六', count: 35 },
    { date: '周日', count: 20 },
  ],
  revenueTrend: [
    { month: '1月', amount: 85000 },
    { month: '2月', amount: 92000 },
    { month: '3月', amount: 78000 },
    { month: '4月', amount: 95000 },
    { month: '5月', amount: 88000 },
    { month: '6月', amount: 102000 },
  ],
  workOrderTypeDistribution: [
    { type: '报修', count: 128 },
    { type: '投诉', count: 56 },
    { type: '咨询', count: 78 },
    { type: '建议', count: 42 },
    { type: '其他', count: 22 },
  ],
  billTypeDistribution: [
    { type: '物业费', amount: 285000 },
    { type: '水费', amount: 42000 },
    { type: '电费', amount: 98000 },
    { type: '燃气费', amount: 56000 },
    { type: '停车费', amount: 78000 },
    { type: '其他', amount: 25000 },
  ],
};

export const mockActivityHeatmapData = (): Array<{ date: string; count: number }> => {
  const data: Array<{ date: string; count: number }> = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10),
    });
  }
  return data;
};

export const workOrderTrendData = [
  { date: '周一', count: 45 },
  { date: '周二', count: 52 },
  { date: '周三', count: 38 },
  { date: '周四', count: 65 },
  { date: '周五', count: 48 },
  { date: '周六', count: 32 },
  { date: '周日', count: 28 },
];

export const workOrderTypeData = [
  { name: '报修', value: 156, color: '#5889FF' },
  { name: '投诉', value: 89, color: '#FF8240' },
  { name: '咨询', value: 234, color: '#34D399' },
  { name: '建议', value: 67, color: '#FBBF24' },
  { name: '其他', value: 45, color: '#A78BFA' },
];

export const slaWarningOrders: WorkOrder[] = [
  {
    id: '1',
    orderNo: 'WO20240101001',
    title: '3号楼电梯故障维修',
    description: '电梯无法正常运行，需要紧急维修',
    type: 'REPAIR',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    source: 'RESIDENT_APP',
    submitterId: 'u001',
    submitterName: '张先生',
    assigneeId: 's001',
    assigneeName: '李师傅',
    communityId: 'c001',
    buildingId: 'b003',
    roomId: 'r001',
    slaDeadline: dayjs().add(25, 'minute').toISOString(),
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: '2',
    orderNo: 'WO20240101002',
    title: '地下车库漏水处理',
    description: 'B2层车库顶部漏水严重',
    type: 'REPAIR',
    status: 'ASSIGNED',
    priority: 'HIGH',
    source: 'PHONE',
    submitterId: 'u002',
    submitterName: '王女士',
    assigneeId: 's002',
    assigneeName: '赵师傅',
    communityId: 'c001',
    buildingId: 'b001',
    slaDeadline: dayjs().add(1, 'hour').add(45, 'minute').toISOString(),
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    updatedAt: dayjs().subtract(4, 'hour').toISOString(),
  },
  {
    id: '3',
    orderNo: 'WO20240101003',
    title: '小区绿化修剪建议',
    description: '建议对小区绿化带进行定期修剪',
    type: 'SUGGESTION',
    status: 'PENDING',
    priority: 'MEDIUM',
    source: 'RESIDENT_APP',
    submitterId: 'u003',
    submitterName: '刘先生',
    communityId: 'c001',
    slaDeadline: dayjs().add(3, 'hour').toISOString(),
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
    updatedAt: dayjs().subtract(5, 'hour').toISOString(),
  },
  {
    id: '4',
    orderNo: 'WO20240101004',
    title: '物业费收费标准咨询',
    description: '咨询本年度物业费收费标准及缴费方式',
    type: 'CONSULT',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    source: 'STAFF_ENTRY',
    submitterId: 'u004',
    submitterName: '陈女士',
    assigneeId: 's003',
    assigneeName: '客服小王',
    communityId: 'c001',
    slaDeadline: dayjs().add(5, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: '5',
    orderNo: 'WO20240101005',
    title: '楼道照明损坏投诉',
    description: '2号楼3单元楼道灯长期不亮',
    type: 'COMPLAINT',
    status: 'PENDING',
    priority: 'HIGH',
    source: 'PHONE',
    submitterId: 'u005',
    submitterName: '周先生',
    communityId: 'c001',
    buildingId: 'b002',
    slaDeadline: dayjs().add(45, 'minute').toISOString(),
    createdAt: dayjs().subtract(8, 'hour').toISOString(),
    updatedAt: dayjs().subtract(8, 'hour').toISOString(),
  },
];

export const hotActivities: Activity[] = [
  {
    id: 'a001',
    title: '社区亲子运动会',
    description: '增进邻里感情，促进儿童健康成长',
    category: 'SPORTS',
    status: 'ONGOING',
    coverImage: '',
    location: '小区中心广场',
    startTime: dayjs().add(3, 'day').toISOString(),
    endTime: dayjs().add(3, 'day').add(5, 'hour').toISOString(),
    maxParticipants: 100,
    currentParticipants: 78,
    communityId: 'c001',
    createdAt: dayjs().subtract(7, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'a002',
    title: '老年书法兴趣班',
    description: '丰富老年生活，传承中华文化',
    category: 'CULTURE',
    status: 'ONGOING',
    coverImage: '',
    location: '社区活动中心',
    startTime: dayjs().add(5, 'day').toISOString(),
    endTime: dayjs().add(5, 'day').add(2, 'hour').toISOString(),
    maxParticipants: 30,
    currentParticipants: 25,
    communityId: 'c001',
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'a003',
    title: '环保知识讲座',
    description: '普及环保知识，共建绿色家园',
    category: 'EDUCATION',
    status: 'PUBLISHED',
    coverImage: '',
    location: '社区会议室',
    startTime: dayjs().add(7, 'day').toISOString(),
    endTime: dayjs().add(7, 'day').add(2, 'hour').toISOString(),
    maxParticipants: 50,
    currentParticipants: 32,
    communityId: 'c001',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
];

export const topProducts: Product[] = [
  {
    id: 'p001',
    name: '有机蔬菜礼包',
    description: '新鲜有机蔬菜，健康营养',
    price: 88,
    stock: 156,
    category: '生鲜',
    imageUrl: '',
    createdAt: dayjs().subtract(30, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'p002',
    name: '进口水果礼盒',
    description: '精选进口水果，送礼佳品',
    price: 168,
    stock: 89,
    category: '生鲜',
    imageUrl: '',
    createdAt: dayjs().subtract(25, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'p003',
    name: '智能家居套装',
    description: '智能门锁+摄像头套装',
    price: 1299,
    stock: 34,
    category: '智能家居',
    imageUrl: '',
    createdAt: dayjs().subtract(20, 'day').toISOString(),
    updatedAt: dayjs().subtract(3, 'day').toISOString(),
  },
  {
    id: 'p004',
    name: '保洁服务套餐',
    description: '专业保洁，上门服务',
    price: 199,
    stock: 999,
    category: '服务',
    imageUrl: '',
    createdAt: dayjs().subtract(15, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'p005',
    name: '社区食堂月卡',
    description: '营养美味，便捷实惠',
    price: 599,
    stock: 200,
    category: '服务',
    imageUrl: '',
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: dayjs().subtract(5, 'day').toISOString(),
  },
];

export const heatmapData: HeatmapDataPoint[] = [
  { building: '1号楼', activity: '社区活动', value: 45 },
  { building: '1号楼', activity: '志愿活动', value: 32 },
  { building: '1号楼', activity: '文化活动', value: 28 },
  { building: '1号楼', activity: '体育活动', value: 56 },
  { building: '1号楼', activity: '亲子活动', value: 41 },
  { building: '1号楼', activity: '老年活动', value: 23 },
  { building: '2号楼', activity: '社区活动', value: 38 },
  { building: '2号楼', activity: '志愿活动', value: 45 },
  { building: '2号楼', activity: '文化活动', value: 52 },
  { building: '2号楼', activity: '体育活动', value: 33 },
  { building: '2号楼', activity: '亲子活动', value: 29 },
  { building: '2号楼', activity: '老年活动', value: 48 },
  { building: '3号楼', activity: '社区活动', value: 56 },
  { building: '3号楼', activity: '志愿活动', value: 27 },
  { building: '3号楼', activity: '文化活动', value: 39 },
  { building: '3号楼', activity: '体育活动', value: 44 },
  { building: '3号楼', activity: '亲子活动', value: 62 },
  { building: '3号楼', activity: '老年活动', value: 31 },
  { building: '4号楼', activity: '社区活动', value: 33 },
  { building: '4号楼', activity: '志愿活动', value: 41 },
  { building: '4号楼', activity: '文化活动', value: 36 },
  { building: '4号楼', activity: '体育活动', value: 28 },
  { building: '4号楼', activity: '亲子活动', value: 37 },
  { building: '4号楼', activity: '老年活动', value: 54 },
  { building: '5号楼', activity: '社区活动', value: 49 },
  { building: '5号楼', activity: '志愿活动', value: 38 },
  { building: '5号楼', activity: '文化活动', value: 45 },
  { building: '5号楼', activity: '体育活动', value: 51 },
  { building: '5号楼', activity: '亲子活动', value: 43 },
  { building: '5号楼', activity: '老年活动', value: 36 },
  { building: '6号楼', activity: '社区活动', value: 27 },
  { building: '6号楼', activity: '志愿活动', value: 35 },
  { building: '6号楼', activity: '文化活动', value: 42 },
  { building: '6号楼', activity: '体育活动', value: 39 },
  { building: '6号楼', activity: '亲子活动', value: 31 },
  { building: '6号楼', activity: '老年活动', value: 47 },
  { building: '7号楼', activity: '社区活动', value: 44 },
  { building: '7号楼', activity: '志愿活动', value: 52 },
  { building: '7号楼', activity: '文化活动', value: 33 },
  { building: '7号楼', activity: '体育活动', value: 46 },
  { building: '7号楼', activity: '亲子活动', value: 38 },
  { building: '7号楼', activity: '老年活动', value: 29 },
  { building: '8号楼', activity: '社区活动', value: 36 },
  { building: '8号楼', activity: '志愿活动', value: 29 },
  { building: '8号楼', activity: '文化活动', value: 48 },
  { building: '8号楼', activity: '体育活动', value: 35 },
  { building: '8号楼', activity: '亲子活动', value: 54 },
  { building: '8号楼', activity: '老年活动', value: 41 },
];

export const collectionRateData = [
  { name: '已收缴', value: 92.5, color: '#34D399' },
  { name: '未收缴', value: 7.5, color: '#F87171' },
];

export const gmvTrendData = [
  { month: '1月', gmv: 85000, orders: 320 },
  { month: '2月', gmv: 92000, orders: 368 },
  { month: '3月', gmv: 78000, orders: 298 },
  { month: '4月', gmv: 95000, orders: 385 },
  { month: '5月', gmv: 108000, orders: 432 },
  { month: '6月', gmv: 128560, orders: 512 },
];

export const merchantStats = {
  total: 86,
  pending: 12,
  active: 68,
  newThisMonth: 8,
};

export const healthStats = {
  totalRecords: 1258,
  newThisMonth: 156,
  abnormalCount: 42,
};

export interface PendingMerchant {
  id: string;
  name: string;
  type: string;
  contact: string;
  applyTime: string;
  status: 'PENDING' | 'REVIEWING';
}

export const pendingMerchants: PendingMerchant[] = [
  { id: 'm001', name: '鲜优生鲜超市', type: '生鲜食品', contact: '王经理', applyTime: dayjs().subtract(1, 'day').toISOString(), status: 'PENDING' },
  { id: 'm002', name: '悦己美甲工作室', type: '生活服务', contact: '李女士', applyTime: dayjs().subtract(2, 'day').toISOString(), status: 'REVIEWING' },
  { id: 'm003', name: '乐家家政服务', type: '家政服务', contact: '张总', applyTime: dayjs().subtract(3, 'day').toISOString(), status: 'PENDING' },
  { id: 'm004', name: '智慧生活馆', type: '智能家居', contact: '陈经理', applyTime: dayjs().subtract(4, 'day').toISOString(), status: 'PENDING' },
];

export const topProductsWithSales = [
  { name: '有机蔬菜礼包', sales: 328, amount: 28864 },
  { name: '进口水果礼盒', sales: 256, amount: 43008 },
  { name: '社区食堂月卡', sales: 189, amount: 113211 },
  { name: '保洁服务套餐', sales: 145, amount: 28855 },
  { name: '智能家居套装', sales: 86, amount: 111714 },
];

export const satisfactionScore = {
  score: 4.8,
  totalReviews: 256,
  trend: 0.3,
};

export interface ScheduleItem {
  id: string;
  date: string;
  shift: string;
  position: string;
  building: string;
}

export const mySchedule: ScheduleItem[] = [
  { id: 's1', date: '周一', shift: '早班', position: '物业管家', building: '1-3号楼' },
  { id: 's2', date: '周二', shift: '中班', position: '物业管家', building: '4-6号楼' },
  { id: 's3', date: '周三', shift: '早班', position: '物业管家', building: '1-3号楼' },
  { id: 's4', date: '周四', shift: '晚班', position: '物业管家', building: '7-8号楼' },
  { id: 's5', date: '周五', shift: '早班', position: '物业管家', building: '1-3号楼' },
];

export interface HealthReminder {
  id: string;
  title: string;
  description: string;
  type: 'checkup' | 'medication' | 'exercise' | 'diet';
  priority: 'high' | 'medium' | 'low';
  time: string;
}

export const healthReminders: HealthReminder[] = [
  { id: 'h1', title: '年度体检提醒', description: '您的年度体检时间已到，请预约', type: 'checkup', priority: 'high', time: '今天' },
  { id: 'h2', title: '血压测量提醒', description: '请保持每日测量血压的习惯', type: 'medication', priority: 'medium', time: '每天' },
  { id: 'h3', title: '运动建议', description: '建议每日步行6000步以上', type: 'exercise', priority: 'low', time: '每天' },
];

export interface ResidentBill {
  id: string;
  billNo: string;
  type: string;
  amount: number;
  dueDate: string;
  status: string;
}

export const myUnpaidBills: ResidentBill[] = [
  { id: 'b1', billNo: 'WY202406001', type: '物业费', amount: 280, dueDate: '2024-06-30', status: 'UNPAID' },
  { id: 'b2', billNo: 'SD202406002', type: '水费', amount: 45.5, dueDate: '2024-06-25', status: 'UNPAID' },
  { id: 'b3', billNo: 'DD202406003', type: '电费', amount: 128.3, dueDate: '2024-06-25', status: 'UNPAID' },
];

export const myWorkOrderStats = {
  total: 5,
  processing: 2,
  completed: 3,
  pending: 0,
};
