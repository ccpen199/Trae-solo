import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, Clock, User, Truck, Package, CheckCircle2, Radio } from 'lucide-react';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import StatusBadge from '@/components/StatusBadge';

const TABS = [
  { key: 'pending', label: '待调度' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
] as const;

function getTab(status: string) {
  if (status === 'pending') return 'pending';
  if (['dispatched', 'picking_up', 'picked_up', 'in_transit'].includes(status)) return 'in_progress';
  return 'completed';
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === 'SF' || provider === 'sf') {
    return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">顺丰</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">京东</span>;
}

function ProviderDot({ provider }: { provider: string }) {
  const color = (provider === 'SF' || provider === 'sf') ? 'bg-orange-500' : 'bg-red-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export default function Logistics() {
  const { logisticsOrders, loading, fetchLogisticsOrders, dispatchOrder } = useLogisticsStore();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('SF');
  const [toast, setToast] = useState('');

  useEffect(() => { fetchLogisticsOrders(); }, [fetchLogisticsOrders]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const list = useMemo(() => (logisticsOrders as Record<string, unknown>[]) || [], [logisticsOrders]);

  const stats = useMemo(() => {
    let pending = 0, picking = 0, transit = 0, delivered = 0;
    list.forEach((o) => {
      const s = o.status as string;
      if (s === 'pending') pending++;
      if (s === 'picking_up') picking++;
      if (s === 'in_transit') transit++;
      if (s === 'delivered') delivered++;
    });
    return { pending, picking, transit, delivered };
  }, [list]);

  const filtered = useMemo(() => list.filter((o) => getTab((o.status as string) || 'pending') === activeTab), [list, activeTab]);

  const statCards = [
    { label: '待调度', value: stats.pending, icon: Package, color: 'text-yellow-600 bg-yellow-50' },
    { label: '取件中', value: stats.picking, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: '运输中', value: stats.transit, icon: Truck, color: 'text-purple-600 bg-purple-50' },
    { label: '已送达', value: stats.delivered, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  ];

  const handleDispatch = async (orderId: string) => {
    try {
      await dispatchOrder({ order_id: orderId, provider: selectedProvider });
      showToast('派单成功');
      setDispatching(null);
      fetchLogisticsOrders();
    } catch { showToast('派单失败'); }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-text">{s.value}</p>
              <p className="text-xs text-neutral-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-neutral-border">
        {TABS.map((tab) => (
          <button
            key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'border-forest-700 text-forest-700' : 'border-transparent text-neutral-muted hover:text-neutral-text'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-card animate-pulse">
              <div className="h-4 w-24 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-32 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-2 rounded-xl border-2 border-dashed border-neutral-border p-12 text-center">
            <p className="text-sm text-neutral-muted">暂无数据</p>
          </div>
        ) : filtered.map((order) => {
          const id = (order.id as string) || '';
          const isPending = (order.status as string) === 'pending';
          return (
            <div key={id} className="rounded-xl bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(order.provider as string) ? <ProviderBadge provider={(order.provider as string)} /> : <span className="text-xs text-neutral-muted">未分配</span>}
                  <span className="font-mono text-xs text-neutral-muted">{id.slice(-8).toUpperCase()}</span>
                </div>
                <StatusBadge status={(order.status as string) || ''} category="logistics" />
              </div>

              {(order.tracking_number as string) && (
                <div className="mb-2 flex items-center gap-2 text-sm text-neutral-text">
                  <Package className="h-4 w-4 text-neutral-muted" />
                  <span>运单号: {order.tracking_number as string}</span>
                </div>
              )}

              {(order.courier_name as string) && (
                <div className="mb-2 flex items-center gap-2 text-sm text-neutral-text">
                  <User className="h-4 w-4 text-neutral-muted" />
                  <span>快递员: {order.courier_name as string}</span>
                </div>
              )}

              <div className="mb-2 flex items-start gap-2 text-sm text-neutral-text">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                <span>{(order.pickup_address as string) || '-'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-muted">
                <Clock className="h-4 w-4" />
                <span>{(order.pickup_time_slot as string) || '-'}</span>
              </div>

              {isPending && dispatching === id && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-bg p-3">
                  <span className="text-xs text-neutral-muted">选择快递:</span>
                  <button onClick={() => setSelectedProvider('SF')}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${selectedProvider === 'SF' ? 'bg-orange-500 text-white' : 'bg-white text-neutral-text border border-neutral-border'}`}>
                    顺丰
                  </button>
                  <button onClick={() => setSelectedProvider('JD')}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${selectedProvider === 'JD' ? 'bg-red-600 text-white' : 'bg-white text-neutral-text border border-neutral-border'}`}>
                    京东
                  </button>
                  <button onClick={() => handleDispatch(id)}
                    className="ml-auto rounded-lg bg-forest-700 px-3 py-1 text-xs text-white hover:bg-forest-800">
                    派单
                  </button>
                </div>
              )}

              {isPending && dispatching !== id && (
                <button onClick={() => setDispatching(id)}
                  className="mt-3 rounded-lg bg-forest-700 px-3 py-1.5 text-xs text-white hover:bg-forest-800">
                  派单
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-neutral-text">物流商对接状态</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <ProviderDot provider="SF" />
            <span className="text-sm text-neutral-text">顺丰速运</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">已连接</span>
          </div>
          <div className="flex items-center gap-2">
            <ProviderDot provider="JD" />
            <span className="text-sm text-neutral-text">京东物流</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">已连接</span>
          </div>
        </div>
      </div>
    </div>
  );
}
