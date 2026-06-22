import { ShoppingBag, Package, ClipboardList, Clock, Navigation, MapPin, User } from 'lucide-react';
import { Order, RiderProfile, OrderType } from '../../types';

interface OrderCardProps {
  order: Order;
  rider?: RiderProfile & { user?: { nickname: string; avatarUrl: string } };
  onClick?: () => void;
  compact?: boolean;
}

const typeConfig: Record<OrderType, { icon: React.ReactNode; label: string; color: string }> = {
  buy: { icon: <ShoppingBag size={16} />, label: '代购', color: 'text-pink-400 bg-pink-500/15 border-pink-500/30' },
  deliver: { icon: <Package size={16} />, label: '速递', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  errand: { icon: <ClipboardList size={16} />, label: '跑腿', color: 'text-violet-400 bg-violet-500/15 border-violet-500/30' },
};

const statusBadges: Record<string, string> = {
  pending_pay: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pending_accept: 'bg-primary/15 text-blue-400 border-primary/30',
  picking: 'bg-accent/15 text-accent border-accent/30',
  delivering: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  fused: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

const statusLabels: Record<string, string> = {
  pending_pay: '待支付',
  pending_accept: '待接单',
  picking: '取货中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  fused: '已合单',
};

const statusTextLabels = statusLabels;

function calcHaversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function OrderCard({ order, rider, onClick, compact }: OrderCardProps) {
  const tc = typeConfig[order.type];
  const distanceKm = calcHaversine(order.pickup, order.deliver);
  const distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;
  const etaMin = Math.max(10, Math.round(distanceKm * 5 + 10));

  return (
    <div
      onClick={onClick}
      className={`group relative bg-dark/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_40px_-12px_rgba(30,64,255,0.35)] hover:border-primary/40 ${
        compact ? 'p-3' : 'p-5'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 ${tc.color}`}>
            {tc.icon}
            <span>{tc.label}</span>
          </div>
          <h3 className={`font-semibold text-white truncate ${compact ? 'text-sm' : ''}`}>{order.title}</h3>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-medium ${statusBadges[order.status] || statusBadges.pending_accept}`}>
          {statusTextLabels[order.status] || '未知'}
        </span>
      </div>

      {!compact && (
        <p className="text-sm text-white/50 mb-4 line-clamp-2 min-h-[2.5rem]">{order.description}</p>
      )}

      <div className={`flex items-center gap-4 mb-4 text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-center gap-1.5">
          <MapPin size={compact ? 12 : 14} className="text-success" />
          <span className="truncate">{order.pickup.address || '取货点'}</span>
        </div>
        <Navigation size={compact ? 10 : 12} className="text-white/30 shrink-0" />
        <div className="flex items-center gap-1.5">
          <MapPin size={compact ? 12 : 14} className="text-accent" />
          <span className="truncate">{order.deliver.address || '送货点'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-4 text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="flex items-center gap-1.5">
            <Navigation size={compact ? 12 : 14} className="text-primary" />
            <span>{distanceText}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={compact ? 12 : 14} className="text-primary" />
            <span>约 {etaMin} 分钟</span>
          </div>
        </div>

        <div className="text-right">
          <div className={`font-bold bg-gradient-to-r from-accent to-orange-300 bg-clip-text text-transparent ${compact ? 'text-lg' : 'text-xl'}`}>
            ¥{order.totalAmount.toFixed(2)}
          </div>
          {order.surgeFee > 0 && (
            <div className="text-[10px] text-accent/80 font-medium">+¥{order.surgeFee} 加急</div>
          )}
        </div>
      </div>

      {rider && !compact && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-primary/20">
              {rider.user?.nickname?.charAt(0) || rider.userId.slice(-2)}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{rider.user?.nickname || `骑手 ${rider.userId.slice(-4)}`}</div>
              <div className="text-xs text-white/50">
                ⭐ {rider.avgRating.toFixed(1)} · {rider.completedOrders} 单 · {rider.vehicleType}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
            <User size={12} />
            <span>已分配</span>
          </div>
        </div>
      )}
    </div>
  );
}
