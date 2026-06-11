import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  MapPin,
  User,
  Phone,
  Clock,
  Package,
  Navigation,
  Route,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  ArrowRight,
  Download,
  Sparkles,
  Bike,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Order, TableColumn, TableAction } from '@/types';

const mockOrders: Order[] = [
  {
    id: '1',
    order_no: 'DD202406110001',
    customerName: '张先生',
    customerPhone: '138****1234',
    riderName: '李骑手',
    pickup_address: '朝阳区建国路88号SOHO现代城A座1层',
    delivery_address: '海淀区中关村大街1号清华科技园B栋1203',
    goods_type: '餐饮',
    goods_weight: 2.5,
    distance_km: 8.5,
    estimated_price: 28,
    status: 'delivering',
    created_at: '2024-06-11T09:30:00Z',
    assigned_at: '2024-06-11T09:32:00Z',
    picked_up_at: '2024-06-11T09:45:00Z',
    estimated_delivery_at: '2024-06-11T10:10:00Z',
    pickup_lat: 39.9042,
    pickup_lng: 116.4074,
    delivery_lat: 39.9842,
    delivery_lng: 116.3074,
  },
  {
    id: '2',
    order_no: 'DD202406110002',
    customerName: '王女士',
    customerPhone: '139****5678',
    riderName: '赵骑手',
    pickup_address: '东城区王府井大街138号新东安市场',
    delivery_address: '西城区金融街7号英蓝国际金融中心',
    goods_type: '文件',
    goods_weight: 0.5,
    distance_km: 5.2,
    estimated_price: 18,
    status: 'picked_up',
    created_at: '2024-06-11T09:45:00Z',
    assigned_at: '2024-06-11T09:47:00Z',
    picked_up_at: '2024-06-11T10:00:00Z',
    estimated_delivery_at: '2024-06-11T10:20:00Z',
    pickup_lat: 39.9142,
    pickup_lng: 116.4174,
    delivery_lat: 39.9242,
    delivery_lng: 116.3574,
  },
  {
    id: '3',
    order_no: 'DD202406110003',
    customerName: '刘先生',
    customerPhone: '137****9012',
    pickup_address: '丰台区方庄路2号方庄购物中心',
    delivery_address: '朝阳区三里屯路19号太古里北区',
    goods_type: '生鲜',
    goods_weight: 5.0,
    distance_km: 12.3,
    estimated_price: 42,
    status: 'pending',
    created_at: '2024-06-11T10:05:00Z',
    estimated_delivery_at: '2024-06-11T10:50:00Z',
    pickup_lat: 39.8642,
    pickup_lng: 116.4374,
    delivery_lat: 39.9342,
    delivery_lng: 116.4574,
  },
  {
    id: '4',
    order_no: 'DD202406110004',
    customerName: '陈女士',
    customerPhone: '136****3456',
    riderName: '孙骑手',
    pickup_address: '海淀区学院路15号北京科技大学',
    delivery_address: '朝阳区望京SOHO T3',
    goods_type: '数码',
    goods_weight: 1.2,
    distance_km: 15.8,
    estimated_price: 52,
    status: 'in_transit',
    created_at: '2024-06-11T09:15:00Z',
    assigned_at: '2024-06-11T09:18:00Z',
    picked_up_at: '2024-06-11T09:40:00Z',
    estimated_delivery_at: '2024-06-11T10:30:00Z',
    pickup_lat: 39.9942,
    pickup_lng: 116.3474,
    delivery_lat: 39.9992,
    delivery_lng: 116.4774,
  },
  {
    id: '5',
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
    exception_type: 'address_unclear',
    exception_reason: '收货地址门牌号模糊，无法定位',
    created_at: '2024-06-11T09:00:00Z',
    assigned_at: '2024-06-11T09:03:00Z',
    pickup_lat: 39.9442,
    pickup_lng: 116.3574,
    delivery_lat: 39.9442,
    delivery_lng: 116.4274,
  },
  {
    id: '6',
    order_no: 'DD202406110006',
    customerName: '吴女士',
    customerPhone: '134****2345',
    riderName: '郑骑手',
    pickup_address: '石景山区万达广场',
    delivery_address: '海淀区五道口华清嘉园',
    goods_type: '服装',
    goods_weight: 1.8,
    distance_km: 18.2,
    estimated_price: 62,
    status: 'delivered',
    created_at: '2024-06-11T08:30:00Z',
    assigned_at: '2024-06-11T08:33:00Z',
    picked_up_at: '2024-06-11T08:55:00Z',
    completed_at: '2024-06-11T09:45:00Z',
    pickup_lat: 39.9042,
    pickup_lng: 116.2274,
    delivery_lat: 39.9942,
    delivery_lng: 116.3374,
  },
  {
    id: '7',
    order_no: 'DD202406110007',
    customerName: '郑先生',
    customerPhone: '133****6789',
    pickup_address: '通州区新华大街',
    delivery_address: '朝阳区CBD万达广场',
    goods_type: '餐饮',
    goods_weight: 3.2,
    distance_km: 22.5,
    estimated_price: 72,
    status: 'cancelled',
    created_at: '2024-06-11T08:00:00Z',
    pickup_lat: 39.9042,
    pickup_lng: 116.6574,
    delivery_lat: 39.9042,
    delivery_lng: 116.4674,
  },
  {
    id: '8',
    order_no: 'DD202406110008',
    customerName: '孙女士',
    customerPhone: '132****0123',
    riderName: '钱骑手',
    pickup_address: '昌平区回龙观',
    delivery_address: '海淀区上地信息路',
    goods_type: '文件',
    goods_weight: 0.8,
    distance_km: 10.5,
    estimated_price: 32,
    status: 'assigned',
    created_at: '2024-06-11T10:00:00Z',
    assigned_at: '2024-06-11T10:02:00Z',
    estimated_delivery_at: '2024-06-11T10:40:00Z',
    pickup_lat: 40.0742,
    pickup_lng: 116.3374,
    delivery_lat: 40.0342,
    delivery_lng: 116.3074,
  },
];

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'assigned', label: '已分配' },
  { key: 'picked_up', label: '已取件' },
  { key: 'in_transit', label: '运输中' },
  { key: 'delivering', label: '配送中' },
  { key: 'delivered', label: '已送达' },
  { key: 'completed', label: '已完成' },
  { key: 'exception', label: '异常' },
  { key: 'cancelled', label: '已取消' },
];

const clusterOrders = [
  {
    id: 'c1',
    orders: ['DD202406110003', 'DD202406110008'],
    distance: 2.1,
    rider: '王骑手',
    eta: 38,
    route: [
      { name: '丰台区方庄路2号', type: 'pickup', time: '10:15' },
      { name: '朝阳区三里屯路19号', type: 'delivery', time: '10:35' },
      { name: '昌平区回龙观', type: 'pickup', time: '10:50' },
      { name: '海淀区上地信息路', type: 'delivery', time: '11:10' },
    ],
  },
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          order.order_no.toLowerCase().includes(kw) ||
          (order.customerName && order.customerName.toLowerCase().includes(kw)) ||
          order.delivery_address.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [statusFilter, keyword]);

  const columns: TableColumn<Order>[] = [
    {
      key: 'order_no',
      title: '订单号',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-mono-code text-sm text-amber-accent-400">{row.order_no}</span>
          <span className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      title: '客户信息',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-200">{row.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">{row.customerPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'goods',
      title: '物品信息',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-200">{row.goods_type}</span>
          </div>
          <span className="text-xs text-gray-500 mt-0.5">{row.goods_weight}kg · {row.distance_km}km</span>
        </div>
      ),
    },
    {
      key: 'address',
      title: '配送地址',
      render: (_, row) => (
        <div className="flex flex-col gap-1 max-w-xs">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-warning-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-400 line-clamp-1">{row.pickup_address}</span>
          </div>
          <div className="flex items-center gap-1 ml-5">
            <ArrowRight className="w-3 h-3 text-gray-600" />
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-success-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-300 line-clamp-1">{row.delivery_address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rider',
      title: '骑手',
      render: (_, row) => row.riderName ? (
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-space-blue-600 flex items-center justify-center">
            <Bike className="w-3.5 h-3.5 text-amber-accent-400" />
          </div>
          <span className="text-sm text-gray-200">{row.riderName}</span>
        </div>
      ) : (
        <span className="text-xs text-warning-400">待派单</span>
      ),
    },
    {
      key: 'price',
      title: '运费',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm font-semibold text-amber-accent-400 font-mono-code">¥{row.estimated_price}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_, row) => (
        <StatusBadge status={row.status} pulse={['pending', 'assigned'].includes(row.status)} />
      ),
    },
  ];

  const actions: TableAction<Order>[] = [
    {
      key: 'view',
      label: '查看详情',
      onClick: (row) => {
        setSelectedOrder(row);
        setDetailOpen(true);
      },
    },
    {
      key: 'dispatch',
      label: '派单',
      onClick: () => setDispatchOpen(true),
    },
  ];

  const getTimeline = (order: Order) => {
    const events = [];
    if (order.created_at) {
      events.push({
        status: '订单创建',
        time: order.created_at,
        icon: Circle,
        color: 'text-gray-400',
        completed: true,
      });
    }
    if (order.assigned_at) {
      events.push({
        status: '骑手已接单',
        time: order.assigned_at,
        icon: Bike,
        color: 'text-info-400',
        completed: true,
      });
    }
    if (order.picked_up_at) {
      events.push({
        status: '已取件',
        time: order.picked_up_at,
        icon: Package,
        color: 'text-warning-400',
        completed: true,
      });
    }
    if (['delivering', 'in_transit'].includes(order.status)) {
      events.push({
        status: '配送中',
        time: new Date().toISOString(),
        icon: Navigation,
        color: 'text-info-400',
        completed: false,
        active: true,
      });
    }
    if (order.completed_at) {
      events.push({
        status: '已送达',
        time: order.completed_at,
        icon: CheckCircle2,
        color: 'text-success-400',
        completed: true,
      });
    }
    if (order.status === 'exception') {
      events.push({
        status: '异常处理中',
        time: new Date().toISOString(),
        icon: AlertTriangle,
        color: 'text-danger-400',
        completed: false,
        active: true,
      });
    }
    if (order.status === 'cancelled') {
      events.push({
        status: '已取消',
        time: order.created_at,
        icon: XCircle,
        color: 'text-danger-400',
        completed: true,
      });
    }
    return events;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">订单管理</h1>
          <p className="text-sm text-gray-400 mt-1">查看、筛选和处理所有配送订单</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDispatchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            智能调度
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索订单号、客户姓名、地址..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50 transition-colors cursor-pointer"
            >
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="week">近7天</option>
              <option value="month">近30天</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors',
              showFilters
                ? 'bg-amber-accent-500/20 border-amber-accent-500/50 text-amber-accent-400'
                : 'bg-space-blue-700 border-space-blue-500 text-gray-300 hover:bg-space-blue-600'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-space-blue-600 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    statusFilter === item.key
                      ? 'bg-amber-accent-500 text-space-blue-900'
                      : 'bg-space-blue-700 text-gray-400 hover:bg-space-blue-600 hover:text-gray-200'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.slice(0, 6).map((item) => {
          const count = item.key === 'all'
            ? mockOrders.length
            : mockOrders.filter((o) => o.status === item.key).length;
          return (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                statusFilter === item.key
                  ? 'bg-amber-accent-500/15 border-amber-accent-500/40 text-amber-accent-400'
                  : 'bg-space-blue-800 border-space-blue-600 text-gray-400 hover:bg-space-blue-700 hover:text-gray-200'
              )}
            >
              {item.label}
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                statusFilter === item.key
                  ? 'bg-amber-accent-500/30'
                  : 'bg-space-blue-600'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        actions={actions}
        pagination={{ page: 1, pageSize: 10, total: filteredOrders.length }}
        onRowClick={(row) => {
          setSelectedOrder(row);
          setDetailOpen(true);
        }}
        emptyText="暂无订单数据"
      />

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="订单详情"
        drawer
        width="w-[520px]"
        drawerPosition="right"
        footer={
          selectedOrder && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDetailOpen(false)}
                className="px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors"
              >
                关闭
              </button>
              {selectedOrder.status === 'pending' && (
                <button className="px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
                  立即派单
                </button>
              )}
              {selectedOrder.status === 'exception' && (
                <button className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg text-sm font-medium transition-colors">
                  处理异常
                </button>
              )}
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-100 font-mono-code">{selectedOrder.order_no}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  创建于 {new Date(selectedOrder.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
              <StatusBadge status={selectedOrder.status} pulse={['pending', 'delivering'].includes(selectedOrder.status)} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">物品类型</div>
                <div className="text-sm text-gray-200">{selectedOrder.goods_type}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">重量</div>
                <div className="text-sm text-gray-200">{selectedOrder.goods_weight} kg</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">距离</div>
                <div className="text-sm text-gray-200">{selectedOrder.distance_km} km</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">预估运费</div>
                <div className="text-sm text-amber-accent-400 font-semibold">¥{selectedOrder.estimated_price}</div>
              </div>
            </div>

            {selectedOrder.exception_reason && (
              <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-danger-400" />
                  <span className="text-sm font-medium text-danger-400">异常原因</span>
                </div>
                <p className="text-sm text-gray-300">{selectedOrder.exception_reason}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-accent-400" />
                配送轨迹
              </h3>
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-0.5">取件地址</div>
                      <div className="text-sm text-gray-200">{selectedOrder.pickup_address}</div>
                    </div>
                  </div>
                  <div className="h-6 ml-2 border-l-2 border-dashed border-space-blue-500" />
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-success-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-0.5">收件地址</div>
                      <div className="text-sm text-gray-200">{selectedOrder.delivery_address}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder.riderName && (
              <div>
                <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-info-400" />
                  骑手信息
                </h3>
                <div className="bg-space-blue-700/50 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-space-blue-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-accent-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">{selectedOrder.riderName}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        138****8888
                      </span>
                      <span className="text-xs text-success-400">准时率 98.5%</span>
                    </div>
                  </div>
                  <button className="p-2 bg-space-blue-600 hover:bg-space-blue-500 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-amber-accent-400" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                时间线
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-space-blue-600" />
                <div className="space-y-4">
                  {getTimeline(selectedOrder).map((event, idx) => {
                    const Icon = event.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 relative">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center z-10',
                          event.active
                            ? 'bg-info-500 animate-pulse'
                            : event.completed
                            ? 'bg-space-blue-700 border-2'
                            : 'bg-space-blue-600'
                        )}>
                          <Icon className={cn('w-2.5 h-2.5', event.color)} />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'text-sm',
                              event.active ? 'text-info-400 font-medium' : 'text-gray-200'
                            )}>
                              {event.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        title="智能聚合调度"
        width="max-w-4xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDispatchOpen(false)}
              className="px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors"
            >
              关闭
            </button>
            <button className="px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              确认派单
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-info-500/10 border border-info-500/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-info-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-info-400 font-medium">AI 智能路径规划已就绪</p>
              <p className="text-xs text-gray-400 mt-0.5">
                检测到 3 公里内 2 个可聚合订单，优化后可节省约 15% 配送时间和 20% 里程
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-accent-400" />
                路径规划可视化
              </h3>
              <div className="relative h-[320px] bg-space-blue-900/50 rounded-lg overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="dispatchGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dispatchGrid)" />
                  </svg>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="dispatchPath" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 60 260 Q 120 180 180 200 T 320 140 Q 380 120 440 80 T 560 60"
                    fill="none"
                    stroke="url(#dispatchPath)"
                    strokeWidth="3"
                    strokeDasharray="0"
                    strokeLinecap="round"
                  />
                  <circle r="4" fill="#F59E0B">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 60 260 Q 120 180 180 200 T 320 140 Q 380 120 440 80 T 560 60" />
                  </circle>
                </svg>

                {[
                  { x: '10%', y: '80%', label: 'P1', type: 'pickup', name: '方庄路2号', time: '10:15' },
                  { x: '30%', y: '60%', label: 'D1', type: 'delivery', name: '三里屯路', time: '10:35' },
                  { x: '55%', y: '42%', label: 'P2', type: 'pickup', name: '回龙观', time: '10:50' },
                  { x: '85%', y: '18%', label: 'D2', type: 'delivery', name: '上地信息路', time: '11:10' },
                ].map((point, idx) => (
                  <div
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: point.x, top: point.y }}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg',
                        point.type === 'pickup'
                          ? 'bg-warning-500 border-warning-300 text-white'
                          : 'bg-success-500 border-success-300 text-white'
                      )}>
                        {point.label}
                      </div>
                      <div className="mt-1 bg-space-blue-700 border border-space-blue-500 rounded px-2 py-1 text-xs shadow-lg">
                        <div className="text-gray-100 whitespace-nowrap">{point.name}</div>
                        <div className="text-gray-500">{point.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-accent-400 font-mono-code">38</div>
                  <div className="text-xs text-gray-500">总耗时(分钟)</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-info-400 font-mono-code">12.5</div>
                  <div className="text-xs text-gray-500">总里程(km)</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-success-400 font-mono-code">¥74</div>
                  <div className="text-xs text-gray-500">合并运费</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-warning-400 font-mono-code">20%</div>
                  <div className="text-xs text-gray-500">节省比例</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-accent-400" />
                聚合订单
              </h3>

              {clusterOrders[0].orders.map((orderNo, idx) => (
                <div key={idx} className="bg-space-blue-700/50 border border-space-blue-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-code text-sm text-amber-accent-400">{orderNo}</span>
                    <span className="text-xs px-2 py-0.5 bg-info-500/15 text-info-400 rounded-full">
                      第{idx + 1}单
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-warning-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">
                        {clusterOrders[0].route[idx * 2].name}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-success-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {clusterOrders[0].route[idx * 2 + 1].name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-space-blue-700/50 border border-space-blue-600 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">分配骑手</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-space-blue-600 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-amber-accent-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">{clusterOrders[0].rider}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>距离 1.2km</span>
                      <span>·</span>
                      <span>信用分 96</span>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-amber-accent-400 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
