import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  MapPin,
  User,
  Star,
  Users,
  Eye,
  Package,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Send,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import {
  statusTextMap,
  tempControlMap,
  difficultyMap,
  formatMoney,
  formatVolume,
  formatWeight,
  formatTime,
  minutesAgo,
} from '@/utils/format';
import type { CargoOrder, OrderStatus, MatchCandidate, CargoStop } from '@/types';

type TabKey = 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'EXCEPTION' | 'COMPLETED';

const TABS: { key: TabKey; label: string; statuses: OrderStatus[] }[] = [
  { key: 'ALL', label: '全部', statuses: [] },
  { key: 'PENDING', label: '待匹配', statuses: ['PUBLISHED', 'MATCHING', 'MATCHED'] },
  { key: 'IN_TRANSIT', label: '配送中', statuses: ['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'PARTIAL_DELIVERED', 'DELIVERED', 'FULFILLMENT_CHECKING'] },
  { key: 'EXCEPTION', label: '异常', statuses: ['EXCEPTION'] },
  { key: 'COMPLETED', label: '已完成', statuses: ['COMPLETED', 'CANCELLED'] },
];

function StatusBadge({ status }: { status: CargoOrder['status'] }) {
  const cfg = statusTextMap[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className="status-dot animate-pulse" style={{ backgroundColor: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

function CandidateChip({ c }: { c: MatchCandidate }) {
  const d = c.driver;
  return (
    <div className="flex items-center gap-2 p-2 rounded-sm bg-ink-800/60 border border-ink-600/60 hover:border-orange-500/40 transition-colors">
      <img
        src={d.avatar}
        alt={d.name}
        className="w-7 h-7 rounded-sm border border-ink-600 bg-ink-900"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-200 truncate">{d.name}</span>
          <span className="text-yellow-400 text-xs flex items-center shrink-0">
            <Star className="w-3 h-3 fill-current" />{d.rating}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono truncate">{d.licensePlate}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-display text-orange-400 font-semibold">{c.overallScore}分</div>
        <div className="text-[10px] text-slate-500 font-mono">{c.etaMinutes}分钟</div>
      </div>
    </div>
  );
}

function OrderCard({ order, onView }: { order: CargoOrder; onView: () => void }) {
  const pickup = order.stops.find((s: CargoStop) => s.type === 'PICKUP');
  const deliveries = order.stops.filter((s: CargoStop) => s.type === 'DELIVERY');
  const isPending = ['PUBLISHED', 'MATCHING', 'MATCHED'].includes(order.status);
  const candidates = order.matchCandidates ?? [];
  const hasCandidates = isPending && candidates.length > 0;

  return (
    <div className="industrial-card corner-brackets overflow-hidden hover:border-orange-500/30 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg text-orange-400 tracking-tight">{order.orderNo}</span>
            <StatusBadge status={order.status} />
            <span className="hex-tag">{minutesAgo(order.createdAt)}</span>
          </div>
          <div className="font-display text-2xl font-extrabold text-orange-400">
            {formatMoney(order.totalPrice)}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <div className="min-w-0 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm font-semibold text-white">{order.cargoName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="hex-tag"><span className="opacity-60 mr-1">体积</span>{formatVolume(order.volume)}</span>
                <span className="hex-tag"><span className="opacity-60 mr-1">重量</span>{formatWeight(order.weight)}</span>
                <span className="hex-tag" style={{ background: 'rgba(6,182,212,0.1)', color: '#22D3EE' }}>
                  {tempControlMap[order.tempControl].icon} {tempControlMap[order.tempControl].label}
                </span>
                <span
                  className="hex-tag"
                  style={{
                    background:
                      order.loadingDifficulty === 'HIGH' ? 'rgba(239,68,68,0.1)' :
                      order.loadingDifficulty === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color:
                      order.loadingDifficulty === 'HIGH' ? '#F87171' :
                      order.loadingDifficulty === 'MEDIUM' ? '#FBBF24' : '#34D399',
                  }}
                >
                  <AlertTriangle className="w-3 h-3 inline mr-1" />难度 {difficultyMap[order.loadingDifficulty].label}
                </span>
                {order.insurance.enabled && (
                  <span className="hex-tag" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>
                    已投保 ¥{order.insurance.coverage.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-ink-600/60 bg-ink-900/50 p-3.5">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                配送路线 · {order.stops.length} 个节点
              </div>
              <div className="space-y-0.5">
                <div className="flex gap-3 items-start">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                    <div className="w-0.5 flex-1 min-h-[28px] bg-gradient-to-b from-orange-500/60 via-slate-600/40 to-cyan-500/60" />
                  </div>
                  <div className="pb-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-orange-400">取货</span>
                      {pickup?.arrivedAt && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />{formatTime(pickup.arrivedAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-200 truncate mt-0.5">{pickup?.address}</div>
                  </div>
                </div>
                {deliveries.map((d: CargoStop, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full border-2 border-cyan-500 bg-ink-900" />
                      {i < deliveries.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-[28px] bg-cyan-500/40" />
                      )}
                    </div>
                    <div className={`${i < deliveries.length - 1 ? 'pb-2.5' : ''} flex-1 min-w-0`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400">送达{i + 1}</span>
                        {d.arrivedAt && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            <Clock className="w-2.5 h-2.5 inline mr-0.5" />{formatTime(d.arrivedAt)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-200 truncate mt-0.5">{d.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasCandidates && (
              <div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  匹配候选 · {candidates.length} 位司机
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {candidates.slice(0, 3).map((c: MatchCandidate) => (
                    <CandidateChip key={c.driverId} c={c} />
                  ))}
                </div>
              </div>
            )}

            {!hasCandidates && order.driverId && (
              <div className="flex items-center gap-3 p-3 rounded-sm bg-cyan-500/5 border border-cyan-500/20">
                <div className="w-9 h-9 rounded-sm bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-200">已分配司机</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                    点击查看详情获取司机联系方式与实时位置
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-4 xl:border-l xl:border-ink-600/60 xl:pl-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">取货窗</span>
                <span className="text-slate-300 font-mono">
                  {formatTime(order.pickupTimeWindow[0])} - {formatTime(order.pickupTimeWindow[1])}
                </span>
              </div>
              <div className="divider-dashed" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">节点数</span>
                <span className="text-slate-300">1取 / {deliveries.length}送</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">里程</span>
                <span className="text-slate-300 font-mono">约 {Math.round((order.stops.length - 1) * 6.5)} km</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isPending && (
                <button
                  onClick={onView}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-colors rounded-sm"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                >
                  <Users className="w-3.5 h-3.5" />
                  匹配候选 ({candidates.length})
                </button>
              )}
              <button onClick={onView} className="btn-primary w-full">
                <Eye className="w-4 h-4 mr-1.5" />
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShipperOrderList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, init, loading } = useOrderStore();

  const [tab, setTab] = useState<TabKey>('ALL');
  const [keyword, setKeyword] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => { init(); }, [init]);

  const shipperId = user?.id ?? 'shipper_demo';

  const filtered = useMemo(() => {
    let list = orders.filter((o) => o.shipperId === shipperId);
    const tabCfg = TABS.find((t) => t.key === tab);
    if (tabCfg && tabCfg.statuses.length > 0) {
      list = list.filter((o) => tabCfg.statuses.includes(o.status));
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(kw) ||
          o.cargoName.toLowerCase().includes(kw)
      );
    }
    list = [...list].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortDesc ? diff : -diff;
    });
    return list;
  }, [orders, shipperId, tab, keyword, sortDesc]);

  const counts = useMemo(() => {
    const mine = orders.filter((o) => o.shipperId === shipperId);
    return {
      ALL: mine.length,
      PENDING: mine.filter((o) => ['PUBLISHED', 'MATCHING', 'MATCHED'].includes(o.status)).length,
      IN_TRANSIT: mine.filter((o) => ['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'PARTIAL_DELIVERED', 'DELIVERED', 'FULFILLMENT_CHECKING'].includes(o.status)).length,
      EXCEPTION: mine.filter((o) => o.status === 'EXCEPTION').length,
      COMPLETED: mine.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status)).length,
    };
  }, [orders, shipperId]);

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">订单管理</h1>
            <span className="hex-tag">{filtered.length} / {counts.ALL}</span>
          </div>
          <p className="text-sm text-slate-500 font-mono">管理您发布的所有货运订单</p>
        </div>
        <button onClick={() => navigate('/shipper/publish')} className="btn-primary">
          <Send className="w-4 h-4 mr-2" />
          发布新货源
        </button>
      </div>

      <div className="industrial-card p-4 corner-brackets">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索订单号 / 货物名称..."
              className="input-industrial pl-10 py-2.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="btn-ghost gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{sortDesc ? '最新优先' : '最早优先'}</span>
            </button>
            <button className="btn-ghost gap-2">
              <Filter className="w-4 h-4" />
              高级筛选
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  active ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t.label}
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-mono rounded-sm ${
                      active ? 'bg-orange-500/20 text-orange-400' : 'bg-ink-700 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading && filtered.length === 0 ? (
        <div className="flex items-center justify-center h-72">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm">装载订单中...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="industrial-card p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-sm bg-ink-800 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-lg font-semibold text-slate-400 mb-2">暂无匹配订单</div>
          <div className="text-sm text-slate-600 font-mono mb-5">
            {keyword ? '尝试更换搜索关键词' : tab !== 'ALL' ? '切换状态标签查看其他订单' : '点击右上角发布您的第一条货源'}
          </div>
          {tab === 'ALL' && !keyword && (
            <button onClick={() => navigate('/shipper/publish')} className="btn-primary">
              <Send className="w-4 h-4 mr-2" />立即发布
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onView={() => navigate(`/shipper/orders/${o.id}`)} />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-mono">
          <span>显示 1 - {filtered.length} / 共 {filtered.length} 条</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-sm border border-ink-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">1</button>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      )}
    </div>
  );
}
