import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  Share2,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  Star,
  ShieldCheck,
  Bike,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import {
  generateMockOrders,
  generateMockRiders,
  generateMockUsers,
  generateMockEvidences,
} from '../../utils/mockData';
import {
  CITY_CENTER,
  haversineDistance,
} from '../../utils';
import TrackLine from '../../components/map/TrackLine';
import RiderMarker from '../../components/map/RiderMarker';
import StatusTimeline from '../../components/order/StatusTimeline';
import EvidenceGallery from '../../components/order/EvidenceGallery';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type {
  Order,
  RiderProfile,
  OrderEvidence,
  GeoPoint,
  TrackPoint,
} from '../../types';

const statusBadgeMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
  pending_pay: { variant: 'warning', label: '待支付' },
  pending_accept: { variant: 'info', label: '待接单' },
  picking: { variant: 'warning', label: '取货中' },
  delivering: { variant: 'warning', label: '配送中' },
  completed: { variant: 'success', label: '已完成' },
  cancelled: { variant: 'danger', label: '已取消' },
  fused: { variant: 'info', label: '已合单' },
};

function MapAutoCenter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      setTimeout(() => map.fitBounds(bounds, { padding: [60, 60] }), 100);
    }
  }, [map, points]);
  return null;
}

export default function OrderTrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [rider, setRider] = useState<
    | (RiderProfile & { user?: { nickname: string; avatarUrl: string } })
    | null
  >(null);
  const [evidences, setEvidences] = useState<OrderEvidence[]>([]);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [riderLiveLocation, setRiderLiveLocation] = useState<GeoPoint | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const users = generateMockUsers(25);
    const riders = generateMockRiders(20);
    const orders = generateMockOrders(15, riders, users);
    const allEvidences = generateMockEvidences(orders);

    let foundOrder = orders.find((o) => o.id === orderId);
    if (!foundOrder) {
      const activeStatuses = ['delivering', 'picking', 'completed', 'pending_accept'];
      foundOrder = orders.find((o) => activeStatuses.includes(o.status)) || orders[0];
    }

    if (foundOrder) {
      setOrder(foundOrder);
      setEvidences(allEvidences.filter((e) => e.orderId === foundOrder!.id));

      if (foundOrder.riderId) {
        const matchedRider = riders.find((r) => r.userId === foundOrder!.riderId);
        if (matchedRider) {
          const riderUser = users.find((u) => u.id === matchedRider.userId);
          const combined = {
            ...matchedRider,
            user: riderUser
              ? { nickname: riderUser.nickname, avatarUrl: riderUser.avatarUrl }
              : undefined,
          };
          setRider(combined);
        }
      }

      const dist = haversineDistance(foundOrder.pickup, foundOrder.deliver);
      const numTrackPoints = Math.max(8, Math.min(20, Math.round(dist / 200)));
      const points: TrackPoint[] = [];
      for (let i = 0; i <= numTrackPoints; i++) {
        const t = i / numTrackPoints;
        points.push({
          orderId: foundOrder.id,
          riderId: foundOrder.riderId || '',
          location: {
            lat: foundOrder.pickup.lat + (foundOrder.deliver.lat - foundOrder.pickup.lat) * t,
            lng: foundOrder.pickup.lng + (foundOrder.deliver.lng - foundOrder.pickup.lng) * t,
          },
          etaSecs: Math.round((1 - t) * 30 * 60),
          remainDistanceM: Math.round((1 - t) * dist),
          capturedAt: new Date(Date.now() - (numTrackPoints - i) * 60000),
        });
      }
      setTrackPoints(points);
      setRiderLiveLocation(points[Math.floor(points.length * 0.6)]?.location || null);
    }
  }, [orderId]);

  useEffect(() => {
    if (
      trackPoints.length < 2 ||
      order?.status === 'completed' ||
      order?.status === 'cancelled'
    ) {
      return;
    }

    const startIdx = Math.floor(trackPoints.length * 0.55);
    const endIdx = Math.floor(trackPoints.length * 0.85);
    if (startIdx >= trackPoints.length || endIdx >= trackPoints.length) return;

    const startPoint = trackPoints[startIdx].location;
    const endPoint = trackPoints[endIdx].location;
    const duration = 8000;

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setRiderLiveLocation({
        lat: startPoint.lat + (endPoint.lat - startPoint.lat) * ease,
        lng: startPoint.lng + (endPoint.lng - startPoint.lng) * ease,
      });
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = null;
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      startRef.current = null;
    };
  }, [trackPoints, order?.status]);

  const linePoints: GeoPoint[] = useMemo(
    () => trackPoints.map((tp) => tp.location),
    [trackPoints]
  );

  const mapBoundsPoints: [number, number][] = useMemo(() => {
    const pts: [number, number][] = [];
    if (order) {
      pts.push([order.pickup.lat, order.pickup.lng]);
      pts.push([order.deliver.lat, order.deliver.lng]);
    }
    if (riderLiveLocation) {
      pts.push([riderLiveLocation.lat, riderLiveLocation.lng]);
    }
    return pts.length >= 2 ? pts : [[CITY_CENTER.lat, CITY_CENTER.lng]];
  }, [order, riderLiveLocation]);

  const etaInfo = useMemo(() => {
    if (!riderLiveLocation || !order) return { secs: 0, dist: 0 };
    const dist = haversineDistance(riderLiveLocation, order.deliver);
    return { secs: Math.max(60, Math.round((dist / 1000) * 5 * 60)), dist };
  }, [riderLiveLocation, order]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    await new Promise((r) => setTimeout(r, 1000));
    setActionLoading(null);
    const messages: Record<string, string> = {
      confirm: '已确认送达，感谢您使用闪跑侠！',
      review: '感谢您的评价！',
      cancel: '订单已取消，退款将在3个工作日内到账。',
      call: '正在呼叫骑手...',
      message: '正在打开聊天窗口...',
      share: '分享链接已复制到剪贴板',
    };
    addToast({ type: action === 'cancel' ? 'info' : 'success', message: messages[action] || '操作成功' });
    if (action === 'confirm' || action === 'cancel') {
      setTimeout(() => navigate('/user/orders'), 1500);
    }
  };

  const etaMinutes = Math.round(etaInfo.secs / 60);
  const badge = order ? statusBadgeMap[order.status] || statusBadgeMap.pending_accept : null;

  if (!order) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white/50">加载中...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark pb-8"
    >
      <div className="sticky top-0 z-30 bg-dark/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-white">订单追踪</div>
            <div className="text-[11px] text-white/40 font-mono">#{order.id.slice(-8).toUpperCase()}</div>
          </div>
          <button
            onClick={() => handleAction('share')}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="relative border-b border-white/10" style={{ height: '70vh' }}>
        <MapContainer
          center={[CITY_CENTER.lat, CITY_CENTER.lng]}
          zoom={14}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
          className="!z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapAutoCenter points={mapBoundsPoints} />
          {linePoints.length >= 2 && (
            <TrackLine
              points={linePoints}
              pickup={order.pickup}
              deliver={order.deliver}
            />
          )}
          {rider && riderLiveLocation && (
            <RiderMarker
              rider={{
                ...rider,
                location: riderLiveLocation,
                status: 'on_order',
              }}
              selected
            />
          )}
        </MapContainer>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400]">
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative px-5 py-3 rounded-2xl bg-dark/85 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="relative flex items-center gap-4">
              <div className="text-center">
                <div
                  className="text-3xl font-black text-white leading-none tabular-nums"
                  style={{ animation: 'eta-breathe 2.4s ease-in-out infinite' }}
                >
                  {etaMinutes < 60
                    ? `${etaMinutes}`
                    : `${Math.floor(etaMinutes / 60)}时${(etaMinutes % 60).toString().padStart(2, '0')}`}
                </div>
                <div className="text-[10px] text-white/50 mt-0.5 font-medium">
                  {etaMinutes < 60 ? '分钟' : ''}预计送达
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <Navigation size={12} className="text-primary" />
                  <span>
                    剩余{' '}
                    {etaInfo.dist < 1000
                      ? `${Math.round(etaInfo.dist)}m`
                      : `${(etaInfo.dist / 1000).toFixed(1)}km`}
                  </span>
                </div>
                {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </div>
            </div>
          </motion.div>
        </div>

        <style>{`
          @keyframes eta-breathe {
            0%, 100% { opacity: 1; transform: scale(1); text-shadow: 0 0 0 rgba(30,64,255,0); }
            50% { opacity: 0.92; transform: scale(1.04); text-shadow: 0 0 24px rgba(30,64,255,0.5); }
          }
        `}</style>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-3xl bg-dark/80 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Clock size={16} className="text-primary" />
            </div>
            <h3 className="font-bold text-white">订单状态</h3>
          </div>
          <StatusTimeline order={order} />
        </motion.div>

        {rider && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="rounded-3xl bg-dark/80 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <User size={16} className="text-accent" />
              </div>
              <h3 className="font-bold text-white">骑手信息</h3>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary/30 overflow-hidden">
                  {rider.user?.nickname?.charAt(0) || rider.userId.slice(-2)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center border-2 border-dark">
                  <ShieldCheck size={12} className="text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-white text-lg truncate">
                    {rider.user?.nickname || `骑手 ${rider.userId.slice(-4)}`}
                  </div>
                  {rider.creditScore >= 95 && (
                    <Badge variant="success">金牌骑手</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50 mb-2">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white/80 font-medium">{rider.avgRating.toFixed(1)}</span>
                  </div>
                  <div>信用分 {rider.creditScore}</div>
                  <div className="flex items-center gap-1">
                    <Bike size={12} />
                    <span>{rider.vehicleType}</span>
                  </div>
                </div>
                <div className="text-xs text-white/40">
                  已完成 {rider.completedOrders} 单 · 履约率 {(rider.fulfillRate * 100).toFixed(1)}%
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleAction('call')}
                  className="w-11 h-11 rounded-xl bg-success/15 border border-success/30 text-success flex items-center justify-center hover:bg-success/25 transition-colors"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={() => handleAction('message')}
                  className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {evidences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="rounded-3xl bg-dark/80 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <CheckCircle size={16} className="text-violet-400" />
              </div>
              <h3 className="font-bold text-white">凭证画廊</h3>
              <span className="text-xs text-white/40">({evidences.length})</span>
            </div>
            <EvidenceGallery evidences={evidences} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {order.status === 'delivering' && (
            <Button
              variant="success"
              size="lg"
              fullWidth
              loading={actionLoading === 'confirm'}
              onClick={() => handleAction('confirm')}
              className="!rounded-2xl !h-12 !text-base shadow-xl shadow-success/30 sm:!w-full"
            >
              <CheckCircle size={18} className="mr-1.5" />
              确认送达
            </Button>
          )}
          {order.status === 'completed' && (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              loading={actionLoading === 'review'}
              onClick={() => handleAction('review')}
              className="!rounded-2xl !h-12 !text-base shadow-xl shadow-accent/30 sm:!w-full"
            >
              <Star size={18} className="mr-1.5" />
              评价骑手
            </Button>
          )}
          {order.status === 'pending_accept' && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              loading={actionLoading === 'cancel'}
              onClick={() => handleAction('cancel')}
              className="!rounded-2xl !h-12 !text-base !border-danger/30 !text-danger hover:!bg-danger/10 sm:!w-full"
            >
              <XCircle size={18} className="mr-1.5" />
              取消订单
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
