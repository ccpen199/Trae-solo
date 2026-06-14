import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ChevronRight } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import { useOrderStore } from '@/stores/useOrderStore';
import { CATEGORY_LABELS } from '@/utils/constants';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400', dispatched: 'bg-blue-400', picked_up: 'bg-indigo-400',
  inspecting: 'bg-purple-400', priced: 'bg-mint-400', confirmed: 'bg-forest-400',
  settled: 'bg-green-400', donated: 'bg-accent-light', rejected: 'bg-red-400',
};

const TABS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待派单' },
  { value: 'picked_up', label: '已取件' },
  { value: 'inspecting', label: '质检中' },
  { value: 'priced', label: '已估价' },
  { value: 'settled', label: '已结算' },
];

const MOCK_ORDERS = [
  {
    id: 'ORD-20240101-001',
    category: 'clothing',
    status: 'priced',
    estimatePrice: 85,
    finalPrice: null,
    createdAt: '2024-01-15 10:30',
    timeWindow: '今日 18:00-20:00',
    address: '海淀区知春路88号',
    courier: '顺丰同城 · 王师傅 · 距离1.2km',
    logistics: '逆向物流单 RL-240115-001 · 已到质检仓',
    qc: '质检SOP：图片核验+AI初筛通过，人工复核待确认',
    settlement: 'T+0微信零余额打款待确认',
  },
  {
    id: 'ORD-20240102-002',
    category: 'phone',
    status: 'inspecting',
    estimatePrice: 1200,
    finalPrice: null,
    createdAt: '2024-01-14 14:20',
    timeWindow: '明日 9:00-12:00',
    address: '朝阳区望京SOHO T2',
    courier: '京东快递 · 李师傅 · 预计30分钟接单',
    logistics: '逆向物流单 RL-240114-002 · 运输中',
    qc: 'AI屏幕裂痕识别95%，电池健康人工复核中',
    settlement: '银行卡尾号8821待质检完成后打款',
  },
  {
    id: 'ORD-20240103-003',
    category: 'book',
    status: 'settled',
    estimatePrice: 45,
    finalPrice: 38,
    createdAt: '2024-01-12 09:15',
    timeWindow: '已于 2024-01-12 10:00取件',
    address: '西城区金融街18号',
    courier: '中通公益回收 · 赵师傅',
    logistics: '逆向物流单 RL-240112-003 · 已入库',
    qc: '图书品相抽检通过，公益流向已登记',
    settlement: '2024-01-12 16:20 微信零钱到账',
  },
  {
    id: 'ORD-20240104-004',
    category: 'clothing',
    status: 'pending',
    estimatePrice: null,
    finalPrice: null,
    createdAt: '2024-01-16 16:00',
    timeWindow: '待选择上门时间窗',
    address: '丰台区方庄路66号',
    courier: 'LBS待派单 · 3名快递员可接单',
    logistics: '逆向物流单待生成',
    qc: '待上传照片，AI初筛未开始',
    settlement: '待质检定价后T+0打款',
  },
  {
    id: 'ORD-20240105-005',
    category: 'phone',
    status: 'picked_up',
    estimatePrice: 560,
    finalPrice: null,
    createdAt: '2024-01-13 11:45',
    timeWindow: '2024-01-13 13:00-17:00',
    address: '东城区东直门外大街9号',
    courier: '顺丰同城 · 陈师傅 · 已取件',
    logistics: '逆向物流单 RL-240113-005 · 已揽收',
    qc: '待到仓后执行开机、屏幕、电池三项SOP',
    settlement: '待质检完成后微信零余额打款',
  },
];

interface OrderItem {
  id: string;
  category: string;
  status: string;
  estimatePrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  timeWindow: string;
  address: string;
  courier: string;
  logistics: string;
  qc: string;
  settlement: string;
}

function OrderCard({ order }: { order: OrderItem }) {
  const statusColor = STATUS_COLORS[order.status] || 'bg-gray-400';
  return (
    <Link to={`/orders/${order.id}`} className="block rounded-xl bg-white shadow-card transition hover:shadow-card-hover">
      <div className="flex">
        <div className={`w-1 self-stretch rounded-l-xl ${statusColor}`} />
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CategoryIcon category={order.category} size="sm" showLabel={false} />
              <div>
                <p className="text-sm font-medium text-neutral-text">{CATEGORY_LABELS[order.category]}</p>
                <p className="text-xs text-neutral-muted">{order.id}</p>
              </div>
            </div>
            <StatusBadge status={order.status} category="order" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {order.estimatePrice && (
                <span className="text-xs text-neutral-muted">估价 <span className="text-sm font-medium text-forest-700">¥{order.estimatePrice}</span></span>
              )}
              {order.finalPrice && (
                <span className="text-xs text-neutral-muted">成交 <span className="text-sm font-medium text-forest-700">¥{order.finalPrice}</span></span>
              )}
              <span className="text-xs text-neutral-muted">{order.createdAt}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-muted" />
          </div>
          <div className="mt-4 grid gap-2 border-t border-neutral-border pt-3 text-xs text-neutral-muted sm:grid-cols-2">
            <span>预约时间窗：{order.timeWindow}</span>
            <span>上门地址：{order.address}</span>
            <span>派单快递员：{order.courier}</span>
            <span>逆向物流：{order.logistics}</span>
            <span>质检/AI初筛：{order.qc}</span>
            <span>结算打款：{order.settlement}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Inbox className="h-12 w-12 text-neutral-border" />
      <p className="mt-3 text-sm text-neutral-muted">暂无订单</p>
      <Link to="/estimate" className="mt-4 text-sm font-medium text-mint-500 hover:text-forest-700">去估价 →</Link>
    </div>
  );
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS);
  const { fetchOrders, loading } = useOrderStore();

  useEffect(() => {
    fetchOrders(activeTab ? { status: activeTab } : undefined).then(() => {
      setOrders(MOCK_ORDERS.filter((o) => !activeTab || o.status === activeTab));
    }).catch(() => {
      setOrders(MOCK_ORDERS.filter((o) => !activeTab || o.status === activeTab));
    });
  }, [activeTab, fetchOrders]);

  const filtered = activeTab ? orders.filter((o) => o.status === activeTab) : orders;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-forest-700 mb-6">我的订单</h1>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1.5 shadow-card">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.value ? 'bg-forest-700 text-white' : 'text-neutral-text hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
