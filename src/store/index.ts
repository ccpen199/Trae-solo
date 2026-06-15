import { create } from 'zustand';
import type { User, Order, Address, PageRole, ServiceType, AddressDispatchInfo, ServiceNode, CompensationRecord, QARecordDetail, InsuranceInfo } from '@/types';

interface HomeStats {
  todayDispatched: number;
  payoutRate: number;
  insuranceRate: number;
  avgArriveKm: number;
  avgWorkerScore: number;
  workerCount: number;
  activeOrders: number;
}

interface AppState {
  currentRole: PageRole;
  user: User | null;
  orders: Order[];
  addresses: Address[];
  selectedAddress: Address | null;
  addressDispatchMap: Record<number, AddressDispatchInfo>;
  setCurrentRole: (role: PageRole) => void;
  setUser: (user: User | null) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  setAddresses: (addresses: Address[]) => void;
  setSelectedAddress: (address: Address | null) => void;
  getDispatchInfo: (addressId: number) => AddressDispatchInfo | undefined;
  getHomeStats: () => HomeStats;
  advanceOrderStatus: (orderId: number) => Order | null;
}

const today = '2026-06-16';

const mockUser: User = {
  id: 1,
  phone: '138****8888',
  nickname: '张先生',
  avatar: '',
  created_at: '2024-01-01',
};

const mockAddresses: Address[] = [
  {
    id: 1,
    user_id: 1,
    name: '家',
    detail: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    lng: 116.45,
    lat: 39.9042,
    is_default: true,
  },
  {
    id: 2,
    user_id: 1,
    name: '公司',
    detail: '北京市海淀区中关村大街1号科技大厦B座808室',
    lng: 116.3105,
    lat: 39.9847,
    is_default: false,
  },
  {
    id: 3,
    user_id: 1,
    name: '父母家',
    detail: '北京市西城区金融街甲9号金融街中心C座1502室',
    lng: 116.359,
    lat: 39.9125,
    is_default: false,
  },
];

function genNodes(orderTime: string, status: string): ServiceNode[] {
  const d = orderTime.slice(0, 10);
  const t = orderTime.slice(11, 16);
  const nodes: ServiceNode[] = [];
  const addMin = (time: string, min: number) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + min;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  nodes.push({ id: 1, order_id: 0, node_type: 'order_created', node_label: '订单创建', node_time: `${d} ${addMin(t, -30)}`, remark: '用户3秒快速下单' });

  if (['assigned', 'accepted', 'departing', 'arrived', 'servicing', 'completed'].includes(status)) {
    nodes.push({ id: 2, order_id: 0, node_type: 'assigned', node_label: '系统派单', node_time: `${d} ${addMin(t, -25)}`, remark: '热力图匹配1km内最优阿姨' });
  }
  if (['accepted', 'departing', 'arrived', 'servicing', 'completed'].includes(status)) {
    nodes.push({ id: 3, order_id: 0, node_type: 'accepted', node_label: '阿姨接单', node_time: `${d} ${addMin(t, -20)}`, remark: '李阿姨确认接单' });
  }
  if (['departing', 'arrived', 'servicing', 'completed'].includes(status)) {
    nodes.push({ id: 4, order_id: 0, node_type: 'departing', node_label: '阿姨出发', node_time: `${d} ${addMin(t, -12)}`, remark: '阿姨从家出发，距离0.8km' });
  }
  if (['arrived', 'servicing', 'completed'].includes(status)) {
    nodes.push({ id: 5, order_id: 0, node_type: 'arrived', node_label: '到达地址', node_time: `${d} ${addMin(t, -2)}`, remark: '阿姨已到达服务地址' });
  }
  if (['servicing', 'completed'].includes(status)) {
    nodes.push({ id: 6, order_id: 0, node_type: 'servicing', node_label: '服务开始', node_time: `${d} ${t}`, remark: '服务正式开始，预计3小时后完成' });
  }
  if (['completed'].includes(status)) {
    nodes.push({ id: 7, order_id: 0, node_type: 'completed', node_label: '服务完成', node_time: `${d} ${addMin(t, 180)}`, remark: '服务完成，客户确认满意' });
  }
  return nodes;
}

const compensationRecordForCancelled: CompensationRecord = {
  id: 2001,
  order_id: 1004,
  reason: '阿姨未按约定时间到达，超时35分钟',
  reason_category: '爽约未上门',
  refund_amount: 180,
  coupon_amount: 30,
  coupon_code: 'COMP-Y7F9K2',
  status: 'paid',
  trigger_type: 'auto',
  created_at: '2026-06-10 09:35:00',
  approved_at: '2026-06-10 09:40:00',
  paid_at: '2026-06-10 10:05:00',
  auditor: '系统自动',
  description: '阿姨出发后遇到交通拥堵，预计迟到35分钟以上，系统自动触发爽约赔付。全额退款已到账，30元补偿券已发放至账户。',
};

const qaRecordForCleaning: QARecordDetail = {
  id: 3001,
  order_id: 1003,
  audio_url: '/mock/audio/1003.mp3',
  audio_duration: 10800,
  transcript_text: '客户：您好，麻烦重点打扫一下厨房和卫生间。阿姨：好的，我先从厨房开始，油烟机和灶台都会仔细擦的。客户：好的，谢谢。（30分钟后）阿姨：厨房打扫完了，您看一下。客户：挺干净的，不错。阿姨：接下来打扫卫生间。（1小时后）阿姨：都打扫完了，您检查一下。客户：打扫得很干净，辛苦了。阿姨：不客气，这是我应该做的。',
  transcript_summary: '阿姨准时到达，服务态度良好，厨房和卫生间清洁彻底，客户表示满意。服务过程全程使用标准话术，无投诉。',
  keywords: [
    { text: '准时到达', hit: true, count: 1 },
    { text: '服务态度', hit: true, count: 2 },
    { text: '清洁彻底', hit: true, count: 1 },
    { text: '标准话术', hit: true, count: 3 },
    { text: '投诉', hit: false, count: 0 },
    { text: '差评', hit: false, count: 0 },
    { text: '迟到', hit: false, count: 0 },
  ],
  compliance_rate: 98,
  root_cause: '无',
  root_cause_category: '好评订单',
  root_cause_detail: '客户对服务质量满意，无差评或投诉记录',
  rating: 5,
  complaint_count: 0,
  reviewer: '质检专员-王晓梅',
  review_time: '2026-06-14 16:30:00',
  review_conclusion: 'pass',
  review_remark: '服务流程规范，态度良好，清洁质量达标，建议保持。',
  created_at: '2026-06-14 15:00:00',
  qa_status: 'completed',
};

const qaRecordForBabysitting: QARecordDetail = {
  id: 3002,
  order_id: 1005,
  audio_url: '/mock/audio/1005.mp3',
  audio_duration: 28800,
  transcript_text: '客户：今天麻烦您照顾宝宝，宝宝有点认生。阿姨：放心吧，我会慢慢跟宝宝熟悉的。宝宝：(哭声) 客户：宝宝别哭，阿姨陪你玩。（2小时后）阿姨：宝宝睡着了，刚喂了奶换了尿布。客户：谢谢阿姨，您辛苦了。阿姨：不客气，宝宝很乖的。（服务结束时）客户：今天辛苦了，宝宝今天玩得很开心。阿姨：宝宝确实很乖，我也很喜欢她。客户：对了，下次还找您。',
  transcript_summary: '育婴师服务专业，有耐心，宝宝从认生到熟悉，全天状态良好。客户对服务非常满意，主动预约下次服务。',
  keywords: [
    { text: '专业', hit: true, count: 2 },
    { text: '耐心', hit: true, count: 1 },
    { text: '宝宝开心', hit: true, count: 1 },
    { text: '主动预约', hit: true, count: 1 },
    { text: '投诉', hit: false, count: 0 },
    { text: '差评', hit: false, count: 0 },
  ],
  compliance_rate: 100,
  root_cause: '无',
  root_cause_category: '五星好评',
  root_cause_detail: '育婴师专业耐心，获得客户高度认可，客户主动预约复购',
  rating: 5,
  complaint_count: 0,
  reviewer: '质检组长-李建国',
  review_time: '2026-06-13 10:15:00',
  review_conclusion: 'pass',
  review_remark: '优秀服务案例，建议作为育婴师培训范本，全流程符合SOP标准。',
  created_at: '2026-06-12 20:00:00',
  qa_status: 'completed',
};

const qaRecordForComplaint: QARecordDetail = {
  id: 3003,
  order_id: 1006,
  audio_url: '/mock/audio/1006.mp3',
  audio_duration: 7200,
  transcript_text: '客户：你怎么迟到了这么久？阿姨：不好意思，路上堵车。客户：我都等了快40分钟了。阿姨：真的很抱歉。客户：算了，你赶紧做吧。（服务中）客户：这厨房擦得也太敷衍了吧，油渍还在呢。阿姨：我再擦一下。客户：不用了，就这样吧。（服务结束）客户：服务太不满意了，我要投诉。阿姨：对不起。',
  transcript_summary: '阿姨迟到38分钟，服务质量不达标，厨房清洁敷衍。客户非常不满，当场投诉。',
  keywords: [
    { text: '迟到', hit: true, count: 3 },
    { text: '服务质量', hit: true, count: 2 },
    { text: '投诉', hit: true, count: 2 },
    { text: '不满意', hit: true, count: 2 },
    { text: '敷衍', hit: true, count: 1 },
    { text: '标准话术', hit: false, count: 0 },
  ],
  compliance_rate: 42,
  root_cause: '服务态度与质量问题',
  root_cause_category: '服务质量',
  root_cause_detail: '阿姨迟到严重（38分钟）+ 服务质量不达标（厨房清洁敷衍），导致客户强烈不满并投诉',
  rating: 1,
  complaint_count: 1,
  reviewer: '质检组长-李建国',
  review_time: '2026-06-10 16:00:00',
  review_conclusion: 'fail',
  review_remark: '严重质量问题，已触发自动赔付。建议对该阿姨进行再培训，培训合格后方可重新上岗。',
  created_at: '2026-06-10 14:00:00',
  qa_status: 'completed',
};

const insuranceCleaning: InsuranceInfo = {
  policy_no: 'JZ20260615001001',
  product_name: '家政服务责任险',
  coverage_amount: 500000,
  premium: 2,
  status: 'active',
};

const mockOrders: Order[] = [
  {
    id: 1001,
    user_id: 1,
    worker_id: 101,
    service_type: 'cleaning',
    service_type_label: '日常保洁',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    address_name: '家',
    lng: 116.45,
    lat: 39.9042,
    start_time: `${today} 14:00`,
    duration_hours: 3,
    status: 'servicing',
    status_label: '服务中',
    amount: 182,
    remark: '重点清洁厨房和卫生间',
    worker_name: '李阿姨',
    worker_avatar: '',
    worker_phone: '139****6666',
    worker_score: 4.8,
    distance_km: 0.8,
    created_at: `${today} 10:30`,
    nodes: genNodes(`${today} 14:00`, 'servicing'),
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260615001001' },
  },
  {
    id: 1002,
    user_id: 1,
    worker_id: 102,
    service_type: 'cooking',
    service_type_label: '上门做饭',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    address_name: '家',
    lng: 116.45,
    lat: 39.9042,
    start_time: `${today} 17:30`,
    duration_hours: 2,
    status: 'accepted',
    status_label: '已接单',
    amount: 102,
    worker_name: '王阿姨',
    worker_avatar: '',
    worker_phone: '137****5555',
    worker_score: 4.7,
    distance_km: 1.2,
    created_at: `${today} 09:15`,
    nodes: genNodes(`${today} 17:30`, 'accepted'),
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260615001002', coverage_amount: 300000, product_name: '家政服务责任险（基础版）' },
  },
  {
    id: 1007,
    user_id: 1,
    worker_id: 107,
    service_type: 'babysitting',
    service_type_label: '育婴师',
    address: '北京市海淀区中关村大街1号科技大厦B座808室',
    address_name: '公司',
    lng: 116.3105,
    lat: 39.9847,
    start_time: `${today} 09:00`,
    duration_hours: 8,
    status: 'servicing',
    status_label: '服务中',
    amount: 642,
    worker_name: '刘阿姨',
    worker_avatar: '',
    worker_phone: '135****2222',
    worker_score: 4.9,
    distance_km: 0.5,
    created_at: '2026-06-14 19:00',
    nodes: genNodes(`${today} 09:00`, 'servicing'),
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260615001007', coverage_amount: 800000, product_name: '母婴服务专项险' },
  },
  {
    id: 1003,
    user_id: 1,
    worker_id: 103,
    service_type: 'cleaning',
    service_type_label: '日常保洁',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    address_name: '家',
    lng: 116.45,
    lat: 39.9042,
    start_time: '2026-06-14 09:00',
    duration_hours: 3,
    status: 'completed',
    status_label: '已完成',
    amount: 182,
    worker_name: '李阿姨',
    worker_avatar: '',
    worker_phone: '139****6666',
    worker_score: 4.8,
    distance_km: 0.8,
    created_at: '2026-06-13 20:00',
    nodes: genNodes('2026-06-14 09:00', 'completed'),
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260614001003', status: 'expired' },
    qa_record: qaRecordForCleaning,
  },
  {
    id: 1005,
    user_id: 1,
    worker_id: 105,
    service_type: 'babysitting',
    service_type_label: '育婴师',
    address: '北京市西城区金融街甲9号金融街中心C座1502室',
    address_name: '父母家',
    lng: 116.359,
    lat: 39.9125,
    start_time: '2026-06-12 08:00',
    duration_hours: 8,
    status: 'completed',
    status_label: '已完成',
    amount: 642,
    worker_name: '陈阿姨',
    worker_avatar: '',
    worker_phone: '136****9999',
    worker_score: 4.95,
    distance_km: 0.6,
    created_at: '2026-06-11 10:00',
    nodes: genNodes('2026-06-12 08:00', 'completed'),
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260612001005', coverage_amount: 800000, product_name: '母婴服务专项险', status: 'expired' },
    qa_record: qaRecordForBabysitting,
  },
  {
    id: 1006,
    user_id: 1,
    worker_id: 106,
    service_type: 'cleaning',
    service_type_label: '日常保洁',
    address: '北京市西城区金融街甲9号金融街中心C座1502室',
    address_name: '父母家',
    lng: 116.359,
    lat: 39.9125,
    start_time: '2026-06-10 14:00',
    duration_hours: 2,
    status: 'compensated',
    status_label: '已赔付',
    amount: 102,
    worker_name: '赵阿姨',
    worker_avatar: '',
    worker_phone: '134****7777',
    worker_score: 3.2,
    distance_km: 3.5,
    is_overtime: true,
    overtime_minutes: 38,
    created_at: '2026-06-10 10:00',
    nodes: [
      { id: 1, order_id: 1006, node_type: 'order_created', node_label: '订单创建', node_time: '2026-06-10 10:00:00', remark: '用户下单' },
      { id: 2, order_id: 1006, node_type: 'assigned', node_label: '系统派单', node_time: '2026-06-10 10:03:00', remark: '匹配附近阿姨' },
      { id: 3, order_id: 1006, node_type: 'accepted', node_label: '阿姨接单', node_time: '2026-06-10 10:08:00', remark: '赵阿姨接单' },
      { id: 4, order_id: 1006, node_type: 'departing', node_label: '阿姨出发', node_time: '2026-06-10 13:15:00', remark: '阿姨出发，距离3.5km' },
      { id: 5, order_id: 1006, node_type: 'arrived', node_label: '到达地址', node_time: '2026-06-10 14:38:00', remark: '阿姨迟到38分钟到达' },
      { id: 6, order_id: 1006, node_type: 'servicing', node_label: '服务开始', node_time: '2026-06-10 14:40:00', remark: '客户不满但同意继续服务' },
      { id: 7, order_id: 1006, node_type: 'completed', node_label: '服务完成', node_time: '2026-06-10 16:40:00', remark: '服务完成，客户投诉' },
    ],
    compensation: {
      ...compensationRecordForCancelled,
      id: 2002,
      order_id: 1006,
      reason: '阿姨迟到38分钟+服务质量不达标',
      reason_category: '迟到+质量问题',
      refund_amount: 102,
      coupon_amount: 30,
      coupon_code: 'COMP-K8M3P5',
      created_at: '2026-06-10 16:50:00',
      approved_at: '2026-06-10 17:00:00',
      paid_at: '2026-06-10 17:20:00',
      auditor: '质检专员-刘芳',
      description: '阿姨迟到38分钟到达，且服务质量不达标（厨房清洁敷衍），客户当场投诉。经质检复核，符合自动赔付条件，全额退款+30元补偿券已到账。',
      trigger_type: 'auto',
      status: 'paid',
    },
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260610001006', status: 'expired' },
    qa_record: qaRecordForComplaint,
  },
  {
    id: 1004,
    user_id: 1,
    worker_id: 104,
    service_type: 'cleaning',
    service_type_label: '日常保洁',
    address: '北京市海淀区中关村大街1号科技大厦B座808室',
    address_name: '公司',
    lng: 116.3105,
    lat: 39.9847,
    start_time: '2026-06-08 09:00',
    duration_hours: 3,
    status: 'cancelled',
    status_label: '已取消（自动赔付）',
    amount: 182,
    worker_name: '孙阿姨',
    worker_avatar: '',
    worker_phone: '133****1111',
    worker_score: 3.8,
    distance_km: 4.2,
    is_overtime: true,
    overtime_minutes: 45,
    created_at: '2026-06-07 16:00',
    nodes: [
      { id: 1, order_id: 1004, node_type: 'order_created', node_label: '订单创建', node_time: '2026-06-07 16:00:00', remark: '用户下单' },
      { id: 2, order_id: 1004, node_type: 'assigned', node_label: '系统派单', node_time: '2026-06-07 16:05:00', remark: '匹配阿姨' },
      { id: 3, order_id: 1004, node_type: 'accepted', node_label: '阿姨接单', node_time: '2026-06-07 16:10:00', remark: '孙阿姨接单' },
      { id: 4, order_id: 1004, node_type: 'departing', node_label: '阿姨出发（延迟）', node_time: '2026-06-08 08:45:00', remark: '阿姨迟到出发' },
    ],
    compensation: compensationRecordForCancelled,
    insurance: { ...insuranceCleaning, policy_no: 'JZ20260608001004', status: 'expired' },
  },
];

const addressDispatchMap: Record<number, AddressDispatchInfo> = {
  1: {
    address_id: 1,
    nearby_workers_count: 12,
    avg_score: 4.82,
    avg_arrive_minutes: 18,
    heat_level: 'high',
    worker_distribution: [
      { distance: '500m内', count: 3 },
      { distance: '1km内', count: 5 },
      { distance: '2km内', count: 4 },
      { distance: '3km内', count: 2 },
    ],
  },
  2: {
    address_id: 2,
    nearby_workers_count: 7,
    avg_score: 4.65,
    avg_arrive_minutes: 28,
    heat_level: 'medium',
    worker_distribution: [
      { distance: '500m内', count: 1 },
      { distance: '1km内', count: 3 },
      { distance: '2km内', count: 2 },
      { distance: '3km内', count: 3 },
    ],
  },
  3: {
    address_id: 3,
    nearby_workers_count: 5,
    avg_score: 4.9,
    avg_arrive_minutes: 32,
    heat_level: 'low',
    worker_distribution: [
      { distance: '500m内', count: 0 },
      { distance: '1km内', count: 2 },
      { distance: '2km内', count: 2 },
      { distance: '3km内', count: 3 },
    ],
  },
};

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'user',
  user: mockUser,
  orders: mockOrders,
  addresses: mockAddresses,
  selectedAddress: mockAddresses[0],
  addressDispatchMap,
  setCurrentRole: (role) => set({ currentRole: role }),
  setUser: (user) => set({ user }),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    })),
  setAddresses: (addresses) => set({ addresses }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),
  getDispatchInfo: (addressId) => get().addressDispatchMap[addressId],
  getHomeStats: () => {
    const orders = get().orders;
    const todayOrders = orders.filter((o) => o.start_time.startsWith(today));
    const compensatedOrders = orders.filter((o) => o.compensation && o.compensation.status === 'paid');
    const insuredOrders = orders.filter((o) => o.insurance && o.insurance.status === 'active');
    const totalCompensation = orders.filter((o) => o.compensation).length;
    const paidCompensation = compensatedOrders.length;
    const avgScore = orders.filter(o => o.worker_score).reduce((sum, o) => sum + (o.worker_score || 0), 0) / (orders.filter(o => o.worker_score).length || 1);
    const activeOrders = orders.filter(o => ['pending', 'assigned', 'accepted', 'departing', 'arrived', 'servicing'].includes(o.status)).length;

    const workersInDispatch = Object.values(addressDispatchMap).reduce((sum, d) => sum + d.nearby_workers_count, 0) / Object.keys(addressDispatchMap).length;

    return {
      todayDispatched: todayOrders.length + 3,
      payoutRate: totalCompensation > 0 ? Math.round((paidCompensation / totalCompensation) * 100) : 100,
      insuranceRate: orders.length > 0 ? Math.round((insuredOrders.length / orders.length) * 100) : 100,
      avgArriveKm: 0.8,
      avgWorkerScore: Math.round(avgScore * 10) / 10 || 4.8,
      workerCount: Math.round(workersInDispatch) * 100,
      activeOrders,
    };
  },
  advanceOrderStatus: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return null;

    const statusFlow: Array<{ status: Order['status']; node_type: ServiceNode['node_type']; node_label: string; remark: string }> = [
      { status: 'assigned', node_type: 'assigned', node_label: '系统派单', remark: '热力图匹配1km内最优阿姨' },
      { status: 'accepted', node_type: 'accepted', node_label: '阿姨接单', remark: '阿姨已确认接单，正在准备出发' },
      { status: 'departing', node_type: 'departing', node_label: '阿姨出发', remark: '阿姨已出发，正在赶往服务地址' },
      { status: 'arrived', node_type: 'arrived', node_label: '到达地址', remark: '阿姨已到达服务地址' },
      { status: 'servicing', node_type: 'servicing', node_label: '服务开始', remark: '服务进行中，全程可追踪' },
      { status: 'completed', node_type: 'completed', node_label: '服务完成', remark: '服务已完成，请您评价' },
    ];

    const currentIdx = statusFlow.findIndex((s) => s.status === order.status);
    if (currentIdx === -1 || currentIdx >= statusFlow.length - 1) return order;

    const nextStep = statusFlow[currentIdx + 1];
    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newNode: ServiceNode = {
      id: (order.nodes?.length || 0) + 1,
      order_id: order.id,
      node_type: nextStep.node_type,
      node_label: nextStep.node_label,
      node_time: nowTime,
      remark: nextStep.remark,
    };

    let is_overtime = order.is_overtime;
    let overtime_minutes = order.overtime_minutes;
    if (nextStep.status === 'arrived' && order.start_time) {
      const expectedTime = new Date(order.start_time.replace(' ', 'T')).getTime();
      const actualTime = new Date(nowTime.replace(' ', 'T')).getTime();
      const diffMin = Math.round((actualTime - expectedTime) / 60000);
      if (diffMin > 30) {
        is_overtime = true;
        overtime_minutes = diffMin;
      }
    }

    const updatedOrder: Order = {
      ...order,
      status: nextStep.status,
      status_label: nextStep.node_label,
      nodes: [...(order.nodes || []), newNode],
      is_overtime,
      overtime_minutes,
    };

    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    }));

    return updatedOrder;
  },
}));

export const serviceTypeList: { type: ServiceType; label: string; icon: string; description: string; price: number }[] = [
  {
    type: 'cleaning',
    label: '日常保洁',
    icon: 'Sparkles',
    description: '专业保洁阿姨上门，全屋深度清洁',
    price: 60,
  },
  {
    type: 'babysitting',
    label: '育婴师',
    icon: 'Baby',
    description: '持证育婴师，科学照料宝宝',
    price: 80,
  },
  {
    type: 'cooking',
    label: '上门做饭',
    icon: 'ChefHat',
    description: '私厨上门，定制家常菜',
    price: 50,
  },
];
