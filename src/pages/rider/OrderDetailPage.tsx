import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Navigation,
  MapPin,
  Phone,
  MessageCircle,
  Receipt,
  FileSignature,
  Package,
  CheckCircle2,
  X,
  ExternalLink,
  Wallet,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Truck,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { useAppStore } from '@/stores/appStore';
import {
  generateMockOrders,
  generateMockRiders,
  generateMockEvidences,
} from '../../utils/mockData';
import { CITY_CENTER } from '../../utils';
import {
  haversineDistance,
  formatCurrency,
  formatDuration,
  formatDateTime,
  getOrderTypeText,
  cn,
} from '../../utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import TrackLine from '../../components/map/TrackLine';
import EvidenceGallery from '../../components/order/EvidenceGallery';
import type { Order, OrderEvidence, OrderStatus, GeoPoint } from '../../types';

type DetailPhase = 'picking' | 'delivering' | 'completed';

function getPhaseFromStatus(status: OrderStatus): DetailPhase {
  switch (status) {
    case 'picking':
      return 'picking';
    case 'delivering':
      return 'delivering';
    case 'completed':
    default:
      return 'completed';
  }
}

function getTrackPoints(pickup: GeoPoint, deliver: GeoPoint): GeoPoint[] {
  const midLat = (pickup.lat + deliver.lat) / 2;
  const midLng = (pickup.lng + deliver.lng) / 2 + 0.002;
  const q1Lat = (pickup.lat + midLat) / 2 - 0.001;
  const q1Lng = (pickup.lng + midLng) / 2;
  const q2Lat = (midLat + deliver.lat) / 2 + 0.0008;
  const q2Lng = (midLng + deliver.lng) / 2;
  return [
    pickup,
    { lat: q1Lat, lng: q1Lng },
    { lat: midLat, lng: midLng },
    { lat: q2Lat, lng: q2Lng },
    deliver,
  ];
}

export default function OrderDetailPage() {
  const addToast = useAppStore((s) => s.addToast);

  const mockRiders = useMemo(() => generateMockRiders(10), []);
  const mockOrders = useMemo(() => generateMockOrders(8, mockRiders), [mockRiders]);

  const seedOrder: Order = useMemo(() => {
    const picking = mockOrders.find((o) => o.status === 'picking');
    if (picking) return picking;
    return {
      ...mockOrders[0],
      status: 'picking',
      pickup: { ...mockOrders[0].pickup, lat: CITY_CENTER.lat + 0.003, lng: CITY_CENTER.lng - 0.004, address: '南京东路188号恒基名人购物中心B1' },
      deliver: { ...mockOrders[0].deliver, lat: CITY_CENTER.lat + 0.012, lng: CITY_CENTER.lng + 0.006, address: '淮海中路333号瑞安广场12楼' },
    };
  }, [mockOrders]);

  const [order, setOrder] = useState<Order>(seedOrder);
  const [evidences, setEvidences] = useState<OrderEvidence[]>(() => generateMockEvidences([order]).slice(0, 2));
  const [etaSecs, setEtaSecs] = useState<number>(18 * 60);
  const [showPathInfo, setShowPathInfo] = useState(true);
  const [expandedFee, setExpandedFee] = useState(false);

  const phase = getPhaseFromStatus(order.status);
  const trackPoints = useMemo(() => getTrackPoints(order.pickup, order.deliver), [order.pickup, order.deliver]);
  const totalDistanceM = useMemo(() => haversineDistance(order.pickup, order.deliver), [order.pickup, order.deliver]);
  const riderEarnings = useMemo(() => Math.round(order.totalAmount * 0.78 * 100) / 100, [order.totalAmount]);

  const mapCenter: [number, number] = useMemo(() => {
    const lats = trackPoints.map((p) => p.lat);
    const lngs = trackPoints.map((p) => p.lng);
    return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  }, [trackPoints]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSecs((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (order.status === 'delivering') {
      setEtaSecs(12 * 60);
    } else if (order.status === 'completed') {
      setEtaSecs(0);
    } else if (order.status === 'picking') {
      setEtaSecs(18 * 60);
    }
  }, [order.status]);

  const phaseMeta: Record<DetailPhase, {
    badgeText: string;
    badgeVariant: 'info' | 'warning' | 'success';
    bgTint: string;
    icon: React.ReactNode;
    mainAction: { label: string; variant: 'accent' | 'success' | 'primary'; onClick: () => void };
    secondaryAction?: { label: string; variant: 'ghost' | 'outline'; onClick: () => void };
  }> = {
    picking: {
      badgeText: '待取货',
      badgeVariant: 'info',
      bgTint: 'from-primary/25 via-primary/10 to-transparent',
      icon: <Package size={22} />,
      mainAction: {
        label: '我已取货',
        variant: 'accent',
        onClick: () => {
          setOrder((o) => ({ ...o, status: 'delivering', pickedAt: new Date() }));
          addToast({ type: 'success', message: '已确认取货，开始配送！', duration: 3000 });
        },
      },
      secondaryAction: {
        label: '取消订单',
        variant: 'ghost',
        onClick: () => {
          addToast({ type: 'warning', message: '请联系客服取消订单', duration: 2500 });
        },
      },
    },
    delivering: {
      badgeText: '配送中',
      badgeVariant: 'warning',
      bgTint: 'from-accent/25 via-accent/10 to-transparent',
      icon: <Truck size={22} />,
      mainAction: {
        label: '确认送达',
        variant: 'success',
        onClick: () => {
          setOrder((o) => ({ ...o, status: 'completed', deliveredAt: new Date() }));
          addToast({ type: 'success', message: '订单已完成，收入已入账！', duration: 3000 });
        },
      },
    },
    completed: {
      badgeText: '已完成',
      badgeVariant: 'success',
      bgTint: 'from-success/25 via-success/10 to-transparent',
      icon: <PackageCheck size={22} />,
      mainAction: {
        label: '查看收入',
        variant: 'primary',
        onClick: () => {
          addToast({ type: 'info', message: `本次配送收入 ${formatCurrency(riderEarnings)}`, duration: 3000 });
        },
      },
    },
  };

  const currentMeta = phaseMeta[phase];

  const handleOpenNavigation = () => {
    const target = phase === 'picking' ? order.pickup : order.deliver;
    const url = `https://uri.amap.com/navigation?to=${target.lng},${target.lat},终点&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=1`;
    window.open(url, '_blank');
    addToast({ type: 'info', message: '正在打开导航...', duration: 2000 });
  };

  const handleUploadEvidence = (type: 'receipt' | 'signature') => {
    const id = `evd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newEv: OrderEvidence = {
      id,
      orderId: order.id,
      type,
      imageUrl: `https://picsum.photos/seed/${id}/400/300`,
      uploadedAt: new Date(),
    };
    setEvidences((prev) => [newEv, ...prev]);
    addToast({
      type: 'success',
      message: type === 'receipt' ? '购物小票上传成功' : '签收凭证上传成功',
      duration: 2500,
    });
  };

  const handleCallUser = () => {
    addToast({ type: 'info', message: '正在呼叫用户 138****8888', duration: 2000 });
  };

  const handleMessageUser = () => {
    addToast({ type: 'info', message: '打开对话窗口', duration: 1500 });
  };

  const renderStatusBadge = () => (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${currentMeta.bgTint} border border-white/10 px-4 py-3.5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            phase === 'picking' && 'bg-primary/20 text-primary',
            phase === 'delivering' && 'bg-accent/20 text-accent',
            phase === 'completed' && 'bg-success/20 text-success',
          )}>
            {currentMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={currentMeta.badgeVariant} className="text-xs px-2.5 py-1">
                {currentMeta.badgeText}
              </Badge>
              <Badge variant="default" className="text-[10px] bg-white/10 text-white/70">
                {getOrderTypeText(order.type)}
              </Badge>
            </div>
            <div className="text-xs text-white/50">订单号 {order.id.slice(0, 12)}...</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Clock size={12} className={etaSecs < 300 ? 'text-danger' : 'text-white/50'} />
            <span className="text-[11px] text-white/50">
              {phase === 'completed' ? '总耗时' : '预计还剩'}
            </span>
          </div>
          <motion.div
            key={etaSecs}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 0.5 }}
            className={cn(
              'text-2xl font-black tabular-nums leading-none',
              etaSecs < 300 ? 'text-danger' : phase === 'completed' ? 'text-success' : 'text-white',
            )}
          >
            {formatDuration(etaSecs)}
          </motion.div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 truncate">订单详情</h1>
          <Badge variant="default" className="bg-white/10 text-white/70">
            {order.id.slice(0, 8)}
          </Badge>
        </div>
        {renderStatusBadge()}
      </div>

      <div className="relative h-[50vh] shrink-0 px-4 pb-3">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-dark/50">
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <TrackLine points={trackPoints} pickup={order.pickup} deliver={order.deliver} />
          </MapContainer>

          <AnimatePresence>
            {showPathInfo && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="absolute top-3 left-3 right-3 rounded-2xl bg-dark/85 backdrop-blur-xl border border-white/10 p-3.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-primary" />
                    <span className="text-xs font-semibold">路径规划</span>
                  </div>
                  <button
                    onClick={() => setShowPathInfo(false)}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-0.5"
                  >
                    收起 <ChevronUp size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">总距离</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {(totalDistanceM / 1000).toFixed(1)}<span className="text-[10px] font-normal text-white/40 ml-0.5">km</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">预计时间</div>
                    <div className="text-sm font-bold text-accent tabular-nums">
                      {Math.max(5, Math.round((totalDistanceM / 1000) * 5))}<span className="text-[10px] font-normal text-white/40 ml-0.5">分钟</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">红绿灯</div>
                    <div className="text-sm font-bold text-violet-400 tabular-nums">
                      6<span className="text-[10px] font-normal text-white/40 ml-0.5">个</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showPathInfo && (
            <button
              onClick={() => setShowPathInfo(true)}
              className="absolute top-3 left-3 rounded-xl bg-dark/80 backdrop-blur-md border border-white/10 px-3 py-2 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              <Navigation size={14} className="text-primary" />
              路径信息
              <ChevronDown size={12} />
            </button>
          )}

          {phase !== 'completed' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenNavigation}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-primary via-indigo-500 to-primary text-white font-bold shadow-2xl shadow-primary/40 border border-white/20 overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
                  animation: 'nav-shimmer 2.5s linear infinite',
                }}
              />
              <Navigation size={20} className="relative z-10" />
              <span className="relative z-10 text-base">开始导航</span>
              <ExternalLink size={14} className="relative z-10 opacity-70" />
            </motion.button>
          )}
        </div>

        <style>{`
          @keyframes nav-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-32 space-y-3 -mx-1 px-4">
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-success" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-white/40 mb-0.5">取货信息</div>
              <div className="text-sm font-semibold text-white">{order.pickup.address}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleMessageUser}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={handleCallUser}
                className="w-8 h-8 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/20 flex items-center justify-center text-primary transition-colors"
              >
                <Phone size={14} />
              </button>
            </div>
          </div>

          <div className="px-4 py-3.5">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={13} className="text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/40 mb-1">物品描述</div>
                <div className="text-xs text-white/75 leading-relaxed">{order.description}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="text-[11px] text-white/40">预计取货时间</div>
              <div className="text-xs font-semibold text-success tabular-nums">
                {formatDateTime(order.expectedPickupAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-white/40 mb-0.5">送达信息</div>
              <div className="text-sm font-semibold text-white">{order.deliver.address}</div>
            </div>
            <Badge variant="warning" className="text-[10px]">收货人 王**</Badge>
          </div>

          <div className="px-4 py-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">预计送达</span>
              <span className="text-xs font-semibold text-accent tabular-nums">
                {formatDateTime(order.expectedDeliverAt)}
              </span>
            </div>
            <div className="rounded-xl bg-accent/5 border border-accent/10 px-3 py-2.5">
              <div className="text-[11px] text-accent/80 mb-1 font-medium">📝 用户备注</div>
              <div className="text-xs text-white/70 leading-relaxed">
                请放在前台保安处，到了给我打电话，谢谢！
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div
            className="px-4 py-3 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors"
            onClick={() => setExpandedFee((f) => !f)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-sm font-semibold">费用明细</div>
                <div className="text-[11px] text-white/40">预计收入 {formatCurrency(riderEarnings)}</div>
              </div>
            </div>
            {expandedFee ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </div>

          {expandedFee && (
            <div className="px-4 py-3.5 space-y-2">
              {[
                { label: '基础配送费', value: order.baseFee },
                { label: '里程费', value: order.mileageFee },
                { label: '溢价小费', value: order.surgeFee, highlight: true },
                { label: '平台服务费', value: -order.platformFee, isDeduct: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/55">
                    {item.label}
                    {item.highlight && <Badge variant="warning" className="ml-1.5 py-0 px-1.5 text-[9px]">溢价</Badge>}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold tabular-nums',
                    item.isDeduct ? 'text-danger' : item.highlight ? 'text-accent' : 'text-white/80',
                  )}>
                    {item.isDeduct ? '-' : ''}{formatCurrency(Math.abs(item.value))}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5">
                <span className="text-sm font-semibold">骑手实收</span>
                <span className="text-lg font-black text-success tabular-nums">{formatCurrency(riderEarnings)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                <FileSignature size={16} className="text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-semibold">凭证上传</div>
                <div className="text-[11px] text-white/40">共 {evidences.length} 份凭证</div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <EvidenceGallery
              evidences={evidences}
              onAddClick={
                phase === 'completed'
                  ? undefined
                  : () => handleUploadEvidence(phase === 'picking' ? 'receipt' : 'signature')
              }
            />

            {phase === 'picking' && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleUploadEvidence('receipt')}
              >
                <Receipt size={15} />
                上传购物小票
              </Button>
            )}
            {phase === 'delivering' && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleUploadEvidence('signature')}
              >
                <FileSignature size={15} />
                上传签收凭证
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-dark via-dark/95 to-transparent pt-6 pb-4 px-4">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-2.5">
            {currentMeta.secondaryAction && (
              <Button
                variant={currentMeta.secondaryAction.variant}
                size="lg"
                onClick={currentMeta.secondaryAction.onClick}
                className="flex-1"
              >
                <X size={18} />
                {currentMeta.secondaryAction.label}
              </Button>
            )}
            <Button
              variant={currentMeta.mainAction.variant}
              size="lg"
              onClick={currentMeta.mainAction.onClick}
              className={currentMeta.secondaryAction ? 'flex-[1.6]' : 'flex-1'}
            >
              {phase === 'completed' ? <Wallet size={18} /> : <CheckCircle2 size={18} />}
              {currentMeta.mainAction.label}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
