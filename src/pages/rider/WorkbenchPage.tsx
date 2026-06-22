import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Wallet,
  ChevronRight,
  Bell,
  Check,
  X,
  Loader2,
  Navigation,
  TrendingUp,
  Zap,
  Flame,
  Star,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { useAppStore } from '@/stores/appStore';
import {
  generateMockRiders,
  generateMockOrders,
} from '../../utils/mockData';
import { computeRiderScore, haversineDistance, formatCurrency, CITY_CENTER } from '../../utils';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import RiderMarker from '../../components/map/RiderMarker';
import OrderMarker from '../../components/map/OrderMarker';
import OrderScoreCard from '../../components/rider/OrderScoreCard';
import type { Order, RiderProfile, OrderRiderScore } from '../../types';

type WorkStatus = 'online' | 'busy' | 'offline';
type FilterTab = 'all' | 'recommend' | 'nearby' | 'premium';

interface PushNotification {
  id: string;
  orderTitle: string;
  amount: number;
  distanceKm: number;
  timestamp: number;
}

const STATUS_LABELS: Record<WorkStatus, string> = {
  online: '在线接单',
  busy: '忙碌中',
  offline: '下线休息',
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  online: 'bg-success',
  busy: 'bg-accent',
  offline: 'bg-gray-500',
};

function seededMockData() {
  const riders = generateMockRiders(20);
  const currentRider = riders[0];
  const orders = generateMockOrders(25, riders);
  const pendingOrders = orders.filter((o) => o.status === 'pending_accept' || o.status === 'pending_pay');
  return { currentRider, riders, allOrders: orders, pendingOrders };
}

export default function WorkbenchPage() {
  const addToast = useAppStore((s) => s.addToast);

  const initialMock = useMemo(seededMockData, []);
  const [workStatus, setWorkStatus] = useState<WorkStatus>('online');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [orders, setOrders] = useState<Order[]>(initialMock.pendingOrders);
  const [currentRider] = useState<RiderProfile>(initialMock.currentRider);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [pushList, setPushList] = useState<PushNotification[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const riderUser = useMemo(
    () => ({
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentRider.userId}`,
      nickname: '骑手小张',
    }),
    [currentRider.userId],
  );

  const todayStats = useMemo(
    () => ({
      completedCount: 18,
      mileageKm: 42.5,
      creditScore: currentRider.creditScore,
      income: 286.5,
    }),
    [currentRider.creditScore],
  );

  const scoredOrders = useMemo(() => {
    return orders
      .map((order) => ({
        order,
        score: computeRiderScore(currentRider, order),
        distanceM: haversineDistance(currentRider.location, order.pickup),
      }))
      .sort((a, b) => b.score.totalScore - a.score.totalScore);
  }, [orders, currentRider]);

  const filteredOrders = useMemo(() => {
    switch (filterTab) {
      case 'recommend':
        return scoredOrders.filter((s) => s.score.totalScore >= 70);
      case 'nearby':
        return scoredOrders.filter((s) => s.distanceM <= 1500);
      case 'premium':
        return scoredOrders.filter((s) => s.order.surgeFee > 0 || s.order.totalAmount >= 25);
      default:
        return scoredOrders;
    }
  }, [scoredOrders, filterTab]);

  const nearbyMarkerOrders = useMemo(
    () => orders.slice(0, 10),
    [orders],
  );

  useEffect(() => {
    if (workStatus !== 'online') return;

    const interval = setInterval(() => {
      const newMock = seededMockData();
      const pickOrder = newMock.pendingOrders[Math.floor(Math.random() * newMock.pendingOrders.length)];
      if (!pickOrder) return;

      const distanceM = haversineDistance(currentRider.location, pickOrder.pickup);
      const notif: PushNotification = {
        id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        orderTitle: pickOrder.title,
        amount: Math.round(pickOrder.totalAmount * 0.78 * 100) / 100,
        distanceKm: Math.round((distanceM / 1000) * 10) / 10,
        timestamp: Date.now(),
      };

      setPushList((prev) => [notif, ...prev].slice(0, 3));
      setOrders((prev) => {
        if (prev.find((o) => o.id === pickOrder.id)) return prev;
        return [pickOrder, ...prev];
      });

      setTimeout(() => {
        setPushList((prev) => prev.filter((p) => p.id !== notif.id));
      }, 5000);
    }, 15000);

    return () => clearInterval(interval);
  }, [workStatus, currentRider.location]);

  const handleAcceptClick = (orderId: string) => {
    setAcceptingOrderId(orderId);
  };

  const confirmAccept = () => {
    if (!acceptingOrderId) return;
    addToast({ type: 'success', message: '接单成功，请尽快前往取货点！', duration: 3000 });
    setOrders((prev) => prev.filter((o) => o.id !== acceptingOrderId));
    setAcceptingOrderId(null);
  };

  const cancelAccept = () => {
    setAcceptingOrderId(null);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 1200));
    const more = seededMockData();
    const newOrders = more.pendingOrders.slice(0, 5);
    setOrders((prev) => {
      const existedIds = new Set(prev.map((o) => o.id));
      const merged = [...prev];
      for (const o of newOrders) {
        if (!existedIds.has(o.id)) merged.push(o);
      }
      return merged;
    });
    setLoadingMore(false);
    addToast({ type: 'info', message: '已加载更多订单', duration: 2000 });
  };

  const acceptingOrder = orders.find((o) => o.id === acceptingOrderId) || null;
  const acceptingScore = acceptingOrder ? computeRiderScore(currentRider, acceptingOrder) : null;

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <AnimatePresence>
        {pushList.map((notif, idx) => (
          <motion.div
            key={notif.id}
            initial={{ y: -120, opacity: 0, x: '-50%' }}
            animate={{ y: 12 + idx * 68, opacity: 1, x: '-50%' }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md"
          >
            <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-dark/95 via-dark to-accent/15 backdrop-blur-xl shadow-2xl p-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-orange-400 to-yellow-400 animate-pulse" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-accent">新订单推送</span>
                    <span className="text-[10px] text-white/40">刚刚</span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate mb-1">{notif.orderTitle}</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-success font-bold">{formatCurrency(notif.amount)}</span>
                    <span className="text-white/50">·</span>
                    <span className="text-white/60 flex items-center gap-1">
                      <Navigation size={12} /> {notif.distanceKm}km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-dark overflow-hidden flex items-center justify-center">
              <span className="text-lg font-bold">{riderUser.nickname.charAt(0)}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold truncate">{riderUser.nickname}</h1>
              <Badge variant="success">实名认证</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-success shrink-0" />
              <span className="text-xs text-white/60">今日收入</span>
              <span className="text-success font-bold tabular-nums">{formatCurrency(todayStats.income)}</span>
            </div>
          </div>
          <div className="relative shrink-0">
            <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
              <Bell size={18} className="text-white/70" />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[workStatus]} animate-pulse`} />
            <div>
              <div className="text-[11px] text-white/40 mb-0.5">当前状态</div>
              <div className="text-sm font-semibold">{STATUS_LABELS[workStatus]}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-xl">
            {(Object.keys(STATUS_LABELS) as WorkStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setWorkStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workStatus === st
                    ? `${STATUS_COLORS[st]} text-white shadow-lg`
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: '今日完成',
              value: todayStats.completedCount,
              unit: '单',
              icon: <Check size={14} />,
              color: 'from-primary/30 to-primary/5',
              textColor: 'text-primary',
              trend: '+3',
            },
            {
              label: '今日里程',
              value: todayStats.mileageKm.toFixed(1),
              unit: 'km',
              icon: <Navigation size={14} />,
              color: 'from-violet-500/30 to-violet-500/5',
              textColor: 'text-violet-400',
              trend: '+5.2',
            },
            {
              label: '信用分',
              value: todayStats.creditScore,
              unit: '分',
              icon: <Star size={14} />,
              color: 'from-success/30 to-success/5',
              textColor: 'text-success',
              trend: '+1',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`group relative rounded-2xl bg-gradient-to-br ${stat.color} border border-white/8 p-3.5 overflow-hidden hover:border-white/20 transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center ${stat.textColor}`}>
                  {stat.icon}
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
              <div className="text-[11px] text-white/45 mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-black tabular-nums ${stat.textColor}`}>{stat.value}</span>
                <span className="text-[10px] text-white/35">{stat.unit}</span>
                <span className="ml-auto text-[10px] text-success/80 flex items-center gap-0.5">
                  <TrendingUp size={10} />
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[40vh] shrink-0 px-4 pb-3">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-dark/50">
          <MapContainer
            center={[CITY_CENTER.lat, CITY_CENTER.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {nearbyMarkerOrders.map((order) => (
              <OrderMarker key={order.id} order={order} />
            ))}
            <RiderMarker
              rider={{
                userId: currentRider.userId,
                location: currentRider.location,
                status: currentRider.status,
                user: riderUser,
              }}
              selected
            />
          </MapContainer>

          <div className="absolute top-3 left-3 rounded-xl bg-dark/80 backdrop-blur-md border border-white/10 px-3 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] text-white/70">待接单</span>
              <span className="text-xs font-bold text-primary tabular-nums">{orders.length}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] text-white/70">附近骑手</span>
              <span className="text-xs font-bold text-success tabular-nums">12</span>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
            <button className="w-9 h-9 rounded-lg bg-dark/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <Navigation size={16} />
            </button>
            <button className="w-9 h-9 rounded-lg bg-dark/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <ChevronRight size={16} className="-rotate-90" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
        <div className="shrink-0 mb-3">
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Flame size={16} className="text-accent" />
                订单池
              </h2>
              <span className="text-xs text-white/40">
                共 <span className="text-white font-bold">{filteredOrders.length}</span> 单
              </span>
            </div>
            <TabList className="w-full bg-white/[0.04]">
              <Tab value="all" className="flex-1 text-xs py-1.5">
                全部
              </Tab>
              <Tab value="recommend" className="flex-1 text-xs py-1.5">
                <span className="flex items-center gap-1">
                  <Star size={12} /> 高推荐
                </span>
              </Tab>
              <Tab value="nearby" className="flex-1 text-xs py-1.5">
                <span className="flex items-center gap-1">
                  <Navigation size={12} /> 近距离
                </span>
              </Tab>
              <Tab value="premium" className="flex-1 text-xs py-1.5">
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} /> 高溢价
                </span>
              </Tab>
            </TabList>
          </Tabs>
        </div>

        <TabPanel value={filterTab} className="mt-0 flex-1 min-h-0">
          <div className="h-full overflow-y-auto pr-1 pb-2 space-y-3 -mr-1">
            {filteredOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-white/30">
                <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
                  <Zap size={32} className="opacity-50" />
                </div>
                <p className="text-sm mb-1">暂无符合条件的订单</p>
                <p className="text-xs text-white/20">切换筛选条件或稍后再来</p>
              </div>
            ) : (
              filteredOrders.map(({ order, score }) => (
                <OrderScoreCardEntry
                  key={order.id}
                  order={order}
                  score={score}
                  onAccept={() => handleAcceptClick(order.id)}
                />
              ))
            )}

            {filteredOrders.length > 0 && (
              <div className="pt-2 pb-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                  className="min-w-[140px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      加载中
                    </>
                  ) : (
                    '加载更多'
                  )}
                </Button>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      <Modal
        isOpen={!!acceptingOrder && !!acceptingScore}
        onClose={cancelAccept}
        size="md"
        title="确认接单"
      >
        {acceptingOrder && acceptingScore && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-bold text-white mb-1">{acceptingOrder.title}</div>
                  <div className="text-xs text-white/50 line-clamp-2">{acceptingOrder.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-white/40 mb-1">预计收入</div>
                  <div className="text-xl font-black text-success tabular-nums">
                    {formatCurrency(Math.round(acceptingOrder.totalAmount * 0.78 * 100) / 100)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                <div className="text-center">
                  <div className="text-[10px] text-white/40 mb-1">匹配度</div>
                  <div className="text-sm font-bold text-primary tabular-nums">{acceptingScore.totalScore}分</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-white/40 mb-1">骑手距离</div>
                  <div className="text-sm font-bold text-violet-400 tabular-nums">
                    {(acceptingScore.distanceM / 1000).toFixed(1)}km
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-white/40 mb-1">取货ETA</div>
                  <div className="text-sm font-bold text-accent tabular-nums">
                    {Math.max(3, Math.round(acceptingScore.estimatedArrivalSecs / 60))}分
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-white/40 bg-white/[0.02] rounded-xl p-3 border border-white/5">
              点击"确认接单"后，订单将分配给您，请在规定时间内前往取货点完成配送。超时未取货可能影响信用评分。
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="lg" fullWidth onClick={cancelAccept}>
                <X size={18} /> 取消
              </Button>
              <Button variant="accent" size="lg" fullWidth onClick={confirmAccept}>
                <Check size={18} /> 确认接单
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function OrderScoreCardEntry({
  order,
  score,
  onAccept,
}: {
  order: Order;
  score: OrderRiderScore;
  onAccept: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <OrderScoreCard order={order} score={score} onAccept={onAccept} />
    </motion.div>
  );
}
