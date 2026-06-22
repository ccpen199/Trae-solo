import { Star, Navigation, Clock, Wallet, AlertTriangle, Check, X, Flame, Award } from 'lucide-react';
import { Order, OrderRiderScore } from '../../types';

interface OrderScoreCardProps {
  order: Order;
  score: OrderRiderScore;
  onAccept?: () => void;
  onReject?: () => void;
}

interface RatingStarsProps {
  value: number;
  outOf?: number;
  size?: 'sm' | 'md';
}

function RatingStars({ value, outOf = 100, size = 'md' }: RatingStarsProps) {
  const pct = Math.max(0, Math.min(1, value / outOf));
  const stars = 5 * pct;
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  const sz = size === 'sm' ? 12 : 14;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        const isEmpty = !filled && !isHalf;
        return (
          <div key={i} className="relative" style={{ width: sz, height: sz }}>
            {!isEmpty && (
              <Star
                size={sz}
                className="text-yellow-400 absolute inset-0"
                fill={isHalf ? 'url(#halfgrad)' : '#FACC15'}
              />
            )}
            {isEmpty && <Star size={sz} className="text-white/15" />}
            {isHalf && (
              <svg width={0} height={0}>
                <defs>
                  <linearGradient id="halfgrad">
                    <stop offset="50%" stopColor="#FACC15" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderScoreCard({ order, score, onAccept, onReject }: OrderScoreCardProps) {
  const distanceKm = score.distanceM / 1000;
  const etaMin = Math.max(3, Math.round(score.estimatedArrivalSecs / 60));
  const riderEarnings = Math.round(order.totalAmount * 0.78 + (order.surgeFee || 0) * 0.95);
  const timeConflict = etaMin > 45 || distanceKm > 8;
  const isHighValue = riderEarnings >= 20;
  const isNearby = distanceKm <= 1.5;

  const scoreMeta = [
    { label: '距离分', value: score.distanceScore, color: 'from-blue-500 to-cyan-400' },
    { label: '信用分', value: score.creditScore, color: 'from-violet-500 to-fuchsia-400' },
    { label: '履约分', value: score.fulfillScore, color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-dark via-dark to-dark/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-success" />

      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-lg font-bold text-white truncate">{order.title}</h3>
              {isHighValue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/25 to-amber-500/25 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold">
                  <Flame size={10} fill="#FACC15" />
                  高价单
                </span>
              )}
              {isNearby && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 border border-success/40 text-success text-[10px] font-bold">
                  <Navigation size={10} />
                  近距离
                </span>
              )}
            </div>
            <p className="text-sm text-white/50 line-clamp-2">{order.description}</p>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Award size={14} className="text-primary" />
              <span className="text-xs text-white/50">综合匹配</span>
            </div>
            <div className="text-3xl font-black bg-gradient-to-r from-primary via-violet-400 to-accent bg-clip-text text-transparent tabular-nums leading-none">
              {score.totalScore}
            </div>
            <div className="text-[11px] text-white/40 mt-1">满分 100</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <RatingStars value={score.totalScore} />
            <span className="text-xs font-semibold text-white/70 tabular-nums">{score.totalScore}/100</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex gap-2">
            {scoreMeta.map((m) => (
              <div key={m.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                <span className="text-[11px] text-white/50">
                  {m.label} <span className="text-white/80 font-semibold tabular-nums">{m.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative rounded-xl bg-white/[0.03] border border-white/8 p-3 overflow-hidden group hover:bg-primary/10 hover:border-primary/30 transition-all">
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary/10 blur-md group-hover:bg-primary/20 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-2 text-primary">
                <Navigation size={15} />
                <span className="text-[11px] font-medium">骑手距离</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {distanceKm < 1 ? `${Math.round(score.distanceM)}m` : `${distanceKm.toFixed(1)}km`}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">距取货点</div>
            </div>
          </div>

          <div className="relative rounded-xl bg-white/[0.03] border border-white/8 p-3 overflow-hidden group hover:bg-accent/10 hover:border-accent/30 transition-all">
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent/10 blur-md group-hover:bg-accent/20 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-2 text-accent">
                <Clock size={15} />
                <span className="text-[11px] font-medium">预计送达</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {etaMin}
                <span className="text-sm font-normal text-white/50 ml-0.5">分钟</span>
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">取货到送达</div>
            </div>
          </div>

          <div className="relative rounded-xl bg-white/[0.03] border border-white/8 p-3 overflow-hidden group hover:bg-success/10 hover:border-success/30 transition-all">
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-success/10 blur-md group-hover:bg-success/20 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-2 text-success">
                <Wallet size={15} />
                <span className="text-[11px] font-medium">预计收入</span>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-success to-emerald-300 bg-clip-text text-transparent tabular-nums">
                ¥{riderEarnings}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">含小费 ¥{order.surgeFee || 0}</div>
            </div>
          </div>
        </div>

        {timeConflict && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/25">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-danger mb-0.5">⚠ 时间/距离风险提示</div>
              <div className="text-[11px] text-white/60">
                配送距离较远或预计时间较长，请确认可以按时完成后再接单
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] text-white/70 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all active:scale-[0.98]"
          >
            <X size={16} strokeWidth={2.5} />
            拒绝
          </button>
          <button
            onClick={onAccept}
            className="flex-[1.4] py-3.5 rounded-xl bg-gradient-to-r from-accent to-orange-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                animation: 'scorecard-shimmer 2.2s linear infinite',
              }}
            />
            <Check size={18} strokeWidth={2.8} className="relative z-10" />
            <span className="relative z-10">立即接单</span>
            <Flame size={16} fill="#fff" className="relative z-10 ml-0.5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scorecard-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
