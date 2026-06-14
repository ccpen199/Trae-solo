import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Banknote, Heart, CircleCheck } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import { useOrderStore } from '@/stores/useOrderStore';
import { CATEGORY_LABELS } from '@/utils/constants';

const STATUS_BANNER_COLORS: Record<string, string> = {
  pending: 'from-yellow-50 to-yellow-100 text-yellow-700',
  dispatched: 'from-blue-50 to-blue-100 text-blue-700',
  picked_up: 'from-indigo-50 to-indigo-100 text-indigo-700',
  inspecting: 'from-purple-50 to-purple-100 text-purple-700',
  priced: 'from-mint-50 to-forest-50 text-forest-700',
  confirmed: 'from-forest-50 to-forest-100 text-forest-700',
  settled: 'from-green-50 to-green-100 text-green-700',
  donated: 'from-accent-light/20 to-accent-light/30 text-accent-dark',
  rejected: 'from-red-50 to-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待派单', dispatched: '已派单', picked_up: '已取件',
  inspecting: '质检中', priced: '已估价', confirmed: '已确认',
  settled: '已结算', donated: '已捐赠', rejected: '已拒绝',
};

const MOCK_DETAIL = {
  id: 'ORD-20240101-001', category: 'clothing', status: 'priced',
  items: ['Nike 运动外套 x1', '优衣库 T恤 x3'], estimatePrice: 85, finalPrice: null,
  address: '北京市朝阳区建国路88号 SOHO现代城A座1201', name: '张三', phone: '138****1234',
  logistics: { provider: '顺丰速运', trackingNo: 'SF1234567890', courier: '王师傅 186****2233', status: 'picked_up' },
  settlement: null,
  timeline: [
    { status: 'pending', time: '2024-01-15 10:30', desc: '订单已提交' },
    { status: 'dispatched', time: '2024-01-15 11:00', desc: '已分配顺丰快递员' },
    { status: 'picked_up', time: '2024-01-15 15:20', desc: '快递员已取件' },
    { status: 'inspecting', time: '2024-01-16 09:00', desc: '进入质检流程' },
    { status: 'priced', time: '2024-01-16 14:30', desc: '质检完成，估价 ¥85' },
  ],
};

function StatusBanner({ status }: { status: string }) {
  const color = STATUS_BANNER_COLORS[status] || 'from-gray-50 to-gray-100 text-gray-700';
  return (
    <div className={`rounded-xl bg-gradient-to-r ${color} p-6`}>
      <StatusBadge status={status} category="order" />
      <p className="mt-2 text-lg font-bold">{STATUS_LABELS[status] || status}</p>
    </div>
  );
}

function Timeline({ events, currentStatus }: { events: typeof MOCK_DETAIL.timeline; currentStatus: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-text mb-4">订单进度</h3>
      <div className="space-y-0">
        {events.map((event, i) => {
          const isCurrent = event.status === currentStatus;
          const isLast = i === events.length - 1;
          return (
            <div key={event.status + event.time} className="flex gap-3">
              <div className="flex flex-col items-center">
                {isCurrent
                  ? <CircleCheck className="h-5 w-5 text-mint-500 animate-pulse" />
                  : <CircleCheck className="h-5 w-5 text-forest-300" />}
                {!isLast && <div className="w-px flex-1 bg-neutral-border my-1" />}
              </div>
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p className={`text-sm font-medium ${isCurrent ? 'text-forest-700' : 'text-neutral-text'}`}>
                  {STATUS_LABELS[event.status] || event.status}
                </p>
                <p className="text-xs text-neutral-muted">{event.time}</p>
                <p className="text-xs text-neutral-muted mt-0.5">{event.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-text mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchOrderDetail, currentOrder, loading } = useOrderStore();

  useEffect(() => {
    if (id) fetchOrderDetail(id);
  }, [id, fetchOrderDetail]);

  const order = (currentOrder as typeof MOCK_DETAIL | null) || MOCK_DETAIL;
  const status = (order.status as string) || 'pending';
  const logistics = order.logistics as typeof MOCK_DETAIL.logistics | null;
  const settlement = order.settlement as typeof MOCK_DETAIL.settlement | null;

  if (loading && !currentOrder) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="rounded-lg p-2 hover:bg-gray-50">
          <ArrowLeft className="h-5 w-5 text-neutral-text" />
        </button>
        <h1 className="text-2xl font-bold text-forest-700">订单详情</h1>
      </div>

      <StatusBanner status={status} />
      <Timeline events={order.timeline} currentStatus={status} />

      <InfoCard title="回收信息">
        <div className="flex items-center gap-3 mb-3">
          <CategoryIcon category={order.category} size="md" />
          <span className="text-sm text-neutral-text">{CATEGORY_LABELS[order.category]}</span>
        </div>
        <div className="space-y-1">
          {order.items.map((item, i) => (
            <p key={i} className="text-sm text-neutral-muted">{item}</p>
          ))}
        </div>
        <div className="mt-3 flex gap-6">
          <span className="text-xs text-neutral-muted">预估 <span className="text-sm font-medium text-forest-700">¥{order.estimatePrice}</span></span>
          {order.finalPrice && (
            <span className="text-xs text-neutral-muted">成交 <span className="text-sm font-medium text-forest-700">¥{order.finalPrice}</span></span>
          )}
        </div>
      </InfoCard>

      <InfoCard title="取件地址">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-mint-500 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-text">{order.name} {order.phone}</p>
            <p className="text-sm text-neutral-muted">{order.address}</p>
          </div>
        </div>
      </InfoCard>

      {logistics && (
        <InfoCard title="物流信息">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-mint-500" />
              <span className="text-sm text-neutral-text">{logistics.provider}</span>
            </div>
            <p className="text-sm text-neutral-muted">运单号：{logistics.trackingNo}</p>
            <p className="text-sm text-neutral-muted">快递员：{logistics.courier}</p>
          </div>
        </InfoCard>
      )}

      {settlement && (
        <InfoCard title="结算信息">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-mint-500" />
            <span className="text-sm text-neutral-text">已结算</span>
          </div>
        </InfoCard>
      )}

      <div className="flex gap-3">
        {status === 'priced' && (
          <Link to="/orders" className="flex-1 rounded-xl bg-forest-700 py-3 text-center text-sm font-semibold text-white hover:bg-forest-800">确认估价</Link>
        )}
        {status === 'settled' && (
          <Link to="/charity" className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-dark flex items-center justify-center gap-2">
            <Heart className="h-4 w-4" /> 捐赠
          </Link>
        )}
      </div>
    </div>
  );
}
