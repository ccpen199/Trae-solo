import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  MapPin,
  MapPinOff,
  Clock,
  UserX,
  PackageX,
  CloudRain,
  RefreshCw,
  Check,
  X,
  Phone,
  User,
  Send,
  Filter,
  ChevronDown,
  Navigation,
  Bike,
  Eye,
  Edit3,
  ShieldAlert,
  Shield,
  FileCheck,
  ShieldCheck,
  Coins,
  ClipboardList,
  Repeat,
  UserCog,
  Upload,
  Paperclip,
  Plus,
  Layers,
  History,
  CircleDot,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { FlowTimeline } from '@/components/common/FlowTimeline';
import type { FlowTimelineItem } from '@/components/common/FlowTimeline';
import { cn } from '@/lib/utils';
import type {
  Order,
  TableColumn,
  TableAction,
  AbnormalFlowRecord,
  ReviewRecord,
  AbnormalHandleAction,
  CompensationPlan,
} from '@/types';

const abnormalTypes = [
  { key: 'all', label: '全部异常', icon: AlertTriangle },
  { key: 'address_unclear', label: '地址模糊', icon: MapPinOff },
  { key: 'timeout', label: '配送超时', icon: Clock },
  { key: 'rider_cancel', label: '骑手取消', icon: UserX },
  { key: 'goods_damaged', label: '货品破损', icon: PackageX },
  { key: 'bad_weather', label: '恶劣天气', icon: CloudRain },
  { key: 'customer_unreachable', label: '联系不上客户', icon: Phone },
];

const abnormalOrderTabs = [
  { key: 'abnormal', label: '异常订单池', icon: AlertTriangle },
  { key: 'circuit', label: '熔断订单池', icon: ShieldAlert },
  { key: 'review', label: '复查记录', icon: ClipboardList },
];

const generateRiderCancelFlow = (orderId: string, cancelReason: string, cancelTime: string): FlowTimelineItem[] => {
  const base = new Date(cancelTime).getTime();
  return [
    {
      id: `${orderId}-flow-1`,
      nodeType: 'info',
      title: '订单创建',
      operator: '系统',
      operatorRole: '自动调度',
      timestamp: new Date(base - 30 * 60 * 1000).toISOString(),
      content: '客户下单成功，订单已进入调度队列',
    },
    {
      id: `${orderId}-flow-2`,
      nodeType: 'success',
      title: '骑手接单',
      operator: '张骑手',
      operatorRole: '配送员',
      timestamp: new Date(base - 27 * 60 * 1000).toISOString(),
      content: '骑手已确认接单，正在前往取货点',
    },
    {
      id: `${orderId}-flow-3`,
      nodeType: 'error',
      title: '骑手取消',
      operator: '王骑手',
      operatorRole: '配送员',
      timestamp: cancelTime,
      content: cancelReason,
      remark: '骑手端上报取消申请，触发异常订单流程',
    },
    {
      id: `${orderId}-flow-4`,
      nodeType: 'warning',
      title: '异常触发',
      operator: '系统',
      operatorRole: '异常监测',
      timestamp: new Date(base + 1 * 60 * 1000).toISOString(),
      content: '检测到骑手取消订单，自动标记为异常订单',
      remark: '异常等级根据取消原因自动评定',
    },
    {
      id: `${orderId}-flow-5`,
      nodeType: 'warning',
      title: '熔断标记',
      operator: '系统',
      operatorRole: '风控模块',
      timestamp: new Date(base + 3 * 60 * 1000).toISOString(),
      content: '该骑手当日已累计取消3单，自动触发熔断保护',
      remark: '暂停该骑手自动接单权限，需人工复核',
    },
    {
      id: `${orderId}-flow-6`,
      nodeType: 'info',
      title: '等待处理',
      operator: '系统',
      operatorRole: '调度中心',
      timestamp: new Date(base + 5 * 60 * 1000).toISOString(),
      content: '订单已转入异常订单池，等待调度员处理',
    },
  ];
};

interface AbnormalOrder extends Order {
  abnormalType: string;
  abnormalLevel: 'critical' | 'high' | 'medium';
  waitTime: number;
  handled: boolean;
  isCircuitBroken?: boolean;
  circuitBreakReason?: string;
  circuitBreakTime?: string;
  flowRecords: FlowTimelineItem[];
  reviewRecords?: ReviewRecord[];
}

const mockAbnormalOrders: AbnormalOrder[] = [
  {
    id: '1',
    order_no: 'DD202406110005',
    customerName: '周先生',
    customerPhone: '135****7890',
    pickup_address: '西城区西直门北大街甲43号',
    delivery_address: '东城区东直门南大街1号',
    goods_type: '医药',
    goods_weight: 0.3,
    distance_km: 6.5,
    estimated_price: 22,
    status: 'exception',
    created_at: '2024-06-11T09:00:00Z',
    exception_type: 'address_unclear',
    exception_reason: '收货地址门牌号模糊，无法定位具体楼栋',
    abnormalType: 'address_unclear',
    abnormalLevel: 'high',
    waitTime: 45,
    handled: false,
    pickup_lat: 39.9442,
    pickup_lng: 116.3574,
    delivery_lat: 39.9442,
    delivery_lng: 116.4274,
    flowRecords: [
      {
        id: '1-flow-1',
        nodeType: 'info',
        title: '订单创建',
        operator: '系统',
        operatorRole: '订单中心',
        timestamp: '2024-06-11T09:00:00Z',
        content: '订单创建成功，等待调度分配骑手',
      },
      {
        id: '1-flow-2',
        nodeType: 'warning',
        title: '地址校验失败',
        operator: '系统',
        operatorRole: '地址风控',
        timestamp: '2024-06-11T09:08:00Z',
        content: '收货地址缺少楼栋与门牌信息，无法生成稳定导航路径',
        remark: '已转入异常订单池，建议联系客户补充地址',
      },
      {
        id: '1-flow-3',
        nodeType: 'info',
        title: '人工介入',
        operator: '调度员李敏',
        operatorRole: '客服调度',
        timestamp: '2024-06-11T09:15:00Z',
        content: '已拨打客户电话，客户暂未接听，10分钟后重试',
      },
    ],
    reviewRecords: [
      {
        id: 'rv-1',
        orderId: '1',
        order_id: '1',
        reviewer: '调度主管',
        reviewerRole: '异常复核',
        timestamp: '2024-06-11T09:30:00Z',
        result: 'follow_up',
        content: '地址仍需确认，保留异常状态',
        suggestion: '发送短信收集补充地址并安排备用骑手',
      },
    ],
  },
  {
    id: '2',
    order_no: 'DD202406110021',
    customerName: '顾女士',
    customerPhone: '136****8821',
    riderName: '王骑手',
    pickup_address: '朝阳区建国门外大街甲6号',
    delivery_address: '海淀区知春路48号盈都大厦',
    goods_type: '文件',
    goods_weight: 0.8,
    distance_km: 13.4,
    estimated_price: 36,
    status: 'exception',
    created_at: '2024-06-11T08:40:00Z',
    assigned_at: '2024-06-11T08:42:00Z',
    exception_type: 'rider_cancel',
    exception_reason: '骑手以车辆故障为由取消订单',
    abnormalType: 'rider_cancel',
    abnormalLevel: 'critical',
    waitTime: 28,
    handled: false,
    isCircuitBroken: true,
    circuitBreakReason: '骑手近2小时取消3单，触发接单熔断',
    circuitBreakTime: '2024-06-11T09:08:00Z',
    pickup_lat: 39.9142,
    pickup_lng: 116.4474,
    delivery_lat: 39.9742,
    delivery_lng: 116.3574,
    flowRecords: generateRiderCancelFlow(
      '2',
      '车辆突发故障，无法继续履约',
      '2024-06-11T09:05:00Z'
    ),
    reviewRecords: [
      {
        id: 'rv-2',
        orderId: '2',
        order_id: '2',
        reviewer: '风控专员',
        reviewerRole: '骑手管理',
        timestamp: '2024-06-11T09:12:00Z',
        result: 'escalate',
        content: '骑手取消行为频繁，已进入熔断复核',
        suggestion: '暂停自动派单并要求骑手上传车辆故障证明',
        attachments: ['故障申报截图.png'],
      },
    ],
  },
  {
    id: '3',
    order_no: 'DD202406110033',
    customerName: '杨先生',
    customerPhone: '138****5520',
    riderName: '赵骑手',
    pickup_address: '丰台区丽泽路16号院',
    delivery_address: '朝阳区三里屯太古里北区',
    goods_type: '生鲜',
    goods_weight: 4.2,
    distance_km: 16.8,
    estimated_price: 58,
    status: 'exception',
    created_at: '2024-06-11T08:10:00Z',
    assigned_at: '2024-06-11T08:16:00Z',
    picked_up_at: '2024-06-11T08:35:00Z',
    exception_type: 'timeout',
    exception_reason: '当前预计送达时间已超承诺时效20分钟',
    abnormalType: 'timeout',
    abnormalLevel: 'medium',
    waitTime: 62,
    handled: true,
    pickup_lat: 39.8742,
    pickup_lng: 116.3274,
    delivery_lat: 39.9342,
    delivery_lng: 116.4574,
    flowRecords: [
      {
        id: '3-flow-1',
        nodeType: 'success',
        title: '骑手取件',
        operator: '赵骑手',
        operatorRole: '配送员',
        timestamp: '2024-06-11T08:35:00Z',
        content: '骑手已完成取件，开始配送',
      },
      {
        id: '3-flow-2',
        nodeType: 'warning',
        title: '时效预警',
        operator: '系统',
        operatorRole: 'SLA监控',
        timestamp: '2024-06-11T09:22:00Z',
        content: '线路拥堵导致预计送达延迟20分钟',
      },
      {
        id: '3-flow-3',
        nodeType: 'success',
        title: '补偿发放',
        operator: '客服小组',
        operatorRole: '客户保障',
        timestamp: '2024-06-11T09:35:00Z',
        content: '已向客户发放8元时效券，订单继续配送',
      },
    ],
    reviewRecords: [
      {
        id: 'rv-3',
        orderId: '3',
        order_id: '3',
        reviewer: '客服主管',
        reviewerRole: '售后复核',
        timestamp: '2024-06-11T09:40:00Z',
        result: 'pass',
        content: '补偿方案已执行，客户接受继续配送',
      },
    ],
  },
  {
    id: '4',
    order_no: 'DD202406110040',
    customerName: '林女士',
    customerPhone: '139****7001',
    riderName: '钱骑手',
    pickup_address: '海淀区学院路38号',
    delivery_address: '昌平区回龙观东大街',
    goods_type: '数码',
    goods_weight: 1.4,
    distance_km: 18.6,
    estimated_price: 66,
    status: 'exception',
    created_at: '2024-06-11T07:50:00Z',
    assigned_at: '2024-06-11T08:00:00Z',
    exception_type: 'goods_damaged',
    exception_reason: '骑手反馈外包装挤压变形，需要确认赔付责任',
    abnormalType: 'goods_damaged',
    abnormalLevel: 'critical',
    waitTime: 74,
    handled: false,
    pickup_lat: 39.9942,
    pickup_lng: 116.3474,
    delivery_lat: 40.0742,
    delivery_lng: 116.3374,
    flowRecords: [
      {
        id: '4-flow-1',
        nodeType: 'success',
        title: '完成取件',
        operator: '钱骑手',
        operatorRole: '配送员',
        timestamp: '2024-06-11T08:10:00Z',
        content: '骑手已完成取件，外包装状态正常',
      },
      {
        id: '4-flow-2',
        nodeType: 'error',
        title: '货损上报',
        operator: '钱骑手',
        operatorRole: '配送员',
        timestamp: '2024-06-11T08:48:00Z',
        content: '配送途中发现外包装挤压变形，已拍照上传',
        attachments: ['外包装照片-1.jpg', '外包装照片-2.jpg'],
      },
      {
        id: '4-flow-3',
        nodeType: 'warning',
        title: '等待理赔',
        operator: '系统',
        operatorRole: '理赔中心',
        timestamp: '2024-06-11T08:50:00Z',
        content: '订单暂停配送，等待理赔专员确认责任',
      },
    ],
  },
];

const actionLabels: Record<AbnormalHandleAction, string> = {
  redispatch: '重新派单',
  manual_intervene: '人工介入',
  circuit_break: '熔断处理',
  compensate: '赔付补偿',
  review: '复查记录',
};

const planLabels: Record<CompensationPlan, string> = {
  coupon: '优惠券补偿',
  refund: '部分退款',
  exchange: '重新配送',
  none: '无需补偿',
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const levelVariant = (level: AbnormalOrder['abnormalLevel']) => {
  if (level === 'critical') return 'danger';
  if (level === 'high') return 'warning';
  return 'info';
};

const levelLabel = (level: AbnormalOrder['abnormalLevel']) => {
  if (level === 'critical') return '紧急';
  if (level === 'high') return '高优先级';
  return '普通';
};

const getTypeLabel = (type: string) => abnormalTypes.find((item) => item.key === type)?.label || type;

export default function AbnormalOrders() {
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('abnormal');
  const [detailOrder, setDetailOrder] = useState<AbnormalOrder | null>(null);
  const [handleOrder, setHandleOrder] = useState<AbnormalOrder | null>(null);
  const [selectedAction, setSelectedAction] = useState<AbnormalHandleAction>('redispatch');
  const [compensationPlan, setCompensationPlan] = useState<CompensationPlan>('coupon');
  const [remark, setRemark] = useState('');

  const tabData = useMemo(() => {
    if (activeTab === 'circuit') {
      return mockAbnormalOrders.filter((order) => order.isCircuitBroken);
    }
    if (activeTab === 'review') {
      return mockAbnormalOrders.filter((order) => (order.reviewRecords?.length || 0) > 0);
    }
    return mockAbnormalOrders;
  }, [activeTab]);

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return tabData.filter((order) => {
      const matchesType = typeFilter === 'all' || order.abnormalType === typeFilter;
      const matchesKeyword =
        !q ||
        order.order_no.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.exception_reason?.toLowerCase().includes(q);
      return matchesType && matchesKeyword;
    });
  }, [keyword, tabData, typeFilter]);

  const stats = useMemo(() => {
    const openOrders = mockAbnormalOrders.filter((order) => !order.handled);
    return [
      { label: '待处理异常', value: openOrders.length, icon: AlertTriangle, color: 'text-danger-400' },
      { label: '熔断订单', value: mockAbnormalOrders.filter((order) => order.isCircuitBroken).length, icon: ShieldAlert, color: 'text-warning-400' },
      { label: '平均等待', value: `${Math.round(mockAbnormalOrders.reduce((sum, order) => sum + order.waitTime, 0) / mockAbnormalOrders.length)}分`, icon: Clock, color: 'text-info-400' },
      { label: '已完成复查', value: mockAbnormalOrders.filter((order) => order.handled).length, icon: FileCheck, color: 'text-success-400' },
    ];
  }, []);

  const columns: TableColumn<AbnormalOrder>[] = [
    {
      key: 'order_no',
      title: '异常订单',
      width: '220px',
      render: (_, row) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-100">{row.order_no}</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <User className="w-3 h-3" />
            {row.customerName}
            <span className="text-space-blue-500">/</span>
            {row.customerPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'abnormalType',
      title: '异常类型',
      width: '140px',
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge variant={levelVariant(row.abnormalLevel)} showDot>
            {levelLabel(row.abnormalLevel)}
          </StatusBadge>
          <span className="text-xs text-gray-400">{getTypeLabel(row.abnormalType)}</span>
        </div>
      ),
    },
    {
      key: 'exception_reason',
      title: '异常说明',
      render: (_, row) => (
        <div className="max-w-md">
          <div className="text-gray-200 line-clamp-2">{row.exception_reason}</div>
          {row.isCircuitBroken && (
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-warning-400">
              <Shield className="w-3 h-3" />
              {row.circuitBreakReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'route',
      title: '配送路线',
      width: '240px',
      render: (_, row) => (
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-success-400" />
            <span className="line-clamp-1">{row.pickup_address}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Navigation className="w-3.5 h-3.5 mt-0.5 text-info-400" />
            <span className="line-clamp-1">{row.delivery_address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'waitTime',
      title: '等待时长',
      width: '110px',
      sortable: true,
      render: (value, row) => (
        <div className={cn('font-medium', row.waitTime > 60 ? 'text-danger-400' : 'text-warning-400')}>
          {String(value)} 分
        </div>
      ),
    },
    {
      key: 'handled',
      title: '状态',
      width: '110px',
      render: (_, row) => (
        <StatusBadge variant={row.handled ? 'success' : 'danger'} pulse={!row.handled}>
          {row.handled ? '已处理' : '待处理'}
        </StatusBadge>
      ),
    },
  ];

  const actions: TableAction<AbnormalOrder>[] = [
    {
      key: 'detail',
      label: '查看详情',
      onClick: (row) => setDetailOrder(row),
    },
    {
      key: 'handle',
      label: '处理异常',
      variant: 'primary',
      onClick: (row) => {
        setHandleOrder(row);
        setSelectedAction(row.isCircuitBroken ? 'circuit_break' : 'redispatch');
        setCompensationPlan(row.abnormalType === 'goods_damaged' ? 'refund' : 'coupon');
        setRemark('');
      },
    },
  ];

  const submitHandle = () => {
    setHandleOrder(null);
    setRemark('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-danger-500/15 border border-danger-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-100">异常订单处理中心</h1>
              <p className="mt-1 text-sm text-gray-400">聚合异常、熔断、赔付和复查流程，支持调度快速闭环。</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-space-blue-600 text-gray-300 hover:bg-space-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新队列
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-amber-accent-500 text-space-blue-950 font-medium hover:bg-amber-accent-400 transition-colors">
            <Send className="w-4 h-4" />
            批量派单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key=*** className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-100">{item.value}</p>
                </div>
                <Icon className={cn('w-7 h-7', item.color)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl">
        <div className="flex flex-col gap-4 p-4 border-b border-space-blue-600 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {abnormalOrderTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key=***
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeTab === tab.key
                      ? 'bg-amber-accent-500 text-space-blue-950 font-medium'
                      : 'text-gray-300 hover:bg-space-blue-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索订单号、客户或原因"
                className="w-full sm:w-64 pl-9 pr-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/70"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-44 pl-9 pr-8 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-100 appearance-none focus:outline-none focus:border-amber-accent-500/70"
              >
                {abnormalTypes.map((type) => (
                  <option key=*** value={type.key}>{type.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          actions={actions}
          rowKey="id"
          emptyText="暂无匹配的异常订单"
          onRowClick={(row) => setDetailOrder(row)}
          className="border-0 rounded-none"
        />
      </div>

      <Modal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `异常详情 ${detailOrder.order_no}` : undefined}
        drawer
        width="w-full max-w-3xl"
      >
        {detailOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-space-blue-900/60 border border-space-blue-600 rounded-lg p-3">
                <p className="text-xs text-gray-500">异常等级</p>
                <div className="mt-2">
                  <StatusBadge variant={levelVariant(detailOrder.abnormalLevel)}>
                    {levelLabel(detailOrder.abnormalLevel)}
                  </StatusBadge>
                </div>
              </div>
              <div className="bg-space-blue-900/60 border border-space-blue-600 rounded-lg p-3">
                <p className="text-xs text-gray-500">异常类型</p>
                <p className="mt-2 text-sm text-gray-100">{getTypeLabel(detailOrder.abnormalType)}</p>
              </div>
              <div className="bg-space-blue-900/60 border border-space-blue-600 rounded-lg p-3">
                <p className="text-xs text-gray-500">进入异常池</p>
                <p className="mt-2 text-sm text-gray-100">{formatTime(detailOrder.created_at)}</p>
              </div>
            </div>

            <div className="bg-space-blue-900/60 border border-space-blue-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
                <CircleDot className="w-4 h-4 text-warning-400" />
                异常说明
              </div>
              <p className="text-sm text-gray-300">{detailOrder.exception_reason}</p>
              {detailOrder.circuitBreakReason && (
                <div className="flex items-start gap-2 rounded-lg bg-warning-500/10 border border-warning-500/20 p-3 text-sm text-warning-300">
                  <ShieldAlert className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-medium">{detailOrder.circuitBreakReason}</div>
                    <div className="mt-1 text-xs text-warning-400/80">触发时间：{formatTime(detailOrder.circuitBreakTime)}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-100">
                <History className="w-4 h-4 text-info-400" />
                流转记录
              </h3>
              <FlowTimeline items={detailOrder.flowRecords} />
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-100">
                <FileCheck className="w-4 h-4 text-success-400" />
                复查记录
              </h3>
              <div className="space-y-3">
                {(detailOrder.reviewRecords || []).map((record) => (
                  <div key=*** className="bg-space-blue-900/60 border border-space-blue-600 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-gray-100">{record.reviewer}</div>
                      <StatusBadge
                        variant={record.result === 'pass' ? 'success' : record.result === 'escalate' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {record.result === 'pass' ? '通过' : record.result === 'escalate' ? '升级' : '跟进'}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">{record.content}</p>
                    {record.suggestion && <p className="mt-1 text-xs text-gray-400">建议：{record.suggestion}</p>}
                  </div>
                ))}
                {(!detailOrder.reviewRecords || detailOrder.reviewRecords.length === 0) && (
                  <div className="text-sm text-gray-500">暂无复查记录</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!handleOrder}
        onClose={() => setHandleOrder(null)}
        title={handleOrder ? `处理异常 ${handleOrder.order_no}` : undefined}
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setHandleOrder(null)}
              className="px-4 py-2 text-sm rounded-lg border border-space-blue-600 text-gray-300 hover:bg-space-blue-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={submitHandle}
              className="px-4 py-2 text-sm rounded-lg bg-amber-accent-500 text-space-blue-950 font-medium hover:bg-amber-accent-400 transition-colors"
            >
              确认处理
            </button>
          </div>
        }
      >
        {handleOrder && (
          <div className="space-y-5">
            <div className="rounded-lg bg-space-blue-900/60 border border-space-blue-600 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-100">{handleOrder.exception_reason}</div>
                  <div className="mt-2 text-xs text-gray-400">
                    客户：{handleOrder.customerName}，等待 {handleOrder.waitTime} 分钟
                  </div>
                </div>
                <StatusBadge variant={levelVariant(handleOrder.abnormalLevel)}>
                  {levelLabel(handleOrder.abnormalLevel)}
                </StatusBadge>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">处理动作</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(actionLabels) as AbnormalHandleAction[]).map((action) => (
                  <button
                    key=***
                    onClick={() => setSelectedAction(action)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm text-left transition-colors',
                      selectedAction === action
                        ? 'border-amber-accent-500 bg-amber-accent-500/15 text-amber-accent-300'
                        : 'border-space-blue-600 text-gray-300 hover:bg-space-blue-700'
                    )}
                  >
                    {actionLabels[action]}
                  </button>
                ))}
              </div>
            </div>

            {selectedAction === 'compensate' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">补偿方案</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(planLabels) as CompensationPlan[]).map((plan) => (
                    <button
                      key=***
                      onClick={() => setCompensationPlan(plan)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm text-left transition-colors',
                        compensationPlan === plan
                          ? 'border-success-500 bg-success-500/15 text-success-300'
                          : 'border-space-blue-600 text-gray-300 hover:bg-space-blue-700'
                      )}
                    >
                      {planLabels[plan]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">处理备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                placeholder="填写重新派单、客户沟通、熔断复核或赔付说明"
                className="w-full resize-none rounded-lg bg-space-blue-900 border border-space-blue-600 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/70"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
