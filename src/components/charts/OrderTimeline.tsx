import { Package, MapPin, CheckCircle2, Clock } from 'lucide-react';
import type { CargoStop } from '@/types';

interface OrderTimelineProps {
  stops: CargoStop[];
}

function formatTime(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function OrderTimeline({ stops }: OrderTimelineProps) {
  return (
    <div className="relative pl-2">
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gradient-to-b from-orange-500/60 via-ink-600 to-signal-cyan/60" />

      <ul className="space-y-5">
        {stops.map((stop, idx) => {
          const isPickup = stop.type === 'PICKUP';
          const isLast = idx === stops.length - 1;
          const arrived = !!stop.arrivedAt;
          const departed = !!stop.departedAt;

          const Icon = isPickup ? Package : MapPin;
          const stateColor = arrived
            ? departed
              ? 'border-signal-green bg-signal-green/15 text-signal-green'
              : 'border-orange-500 bg-orange-500/15 text-orange-500'
            : 'border-ink-600 bg-ink-800 text-slate-500';

          const lineState = isLast
            ? ''
            : departed
              ? 'bg-signal-green'
              : arrived
                ? 'bg-gradient-to-b from-orange-500 to-ink-600'
                : 'bg-ink-600';

          return (
            <li key={`${stop.seq}-${idx}`} className="relative">
              <div className="flex items-start gap-4">
                <div className="relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full border-2 ${stateColor} flex items-center justify-center shrink-0 ${
                      arrived && departed ? 'shadow-glow-green-sm' : arrived ? 'shadow-glow-orange-sm' : ''
                    }`}
                  >
                    {departed ? (
                      <CheckCircle2 size={16} />
                    ) : arrived ? (
                      <Clock size={16} />
                    ) : (
                      <Icon size={15} />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-9 w-0.5 h-[calc(100%-0px)] ${lineState}`}
                      style={{ height: 'calc(1.25rem - 0px)' }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`hex-tag !text-[9px] ${isPickup ? '' : '!bg-signal-cyan/10 !text-signal-cyan'}`}>
                      {isPickup ? `STOP#${stop.seq} · 取货` : `STOP#${stop.seq} · 送达`}
                    </span>
                    {arrived && (
                      <span className="text-[10px] font-mono text-slate-500">
                        到达 {formatTime(stop.arrivedAt)}
                        {departed && ` · 出发 ${formatTime(stop.departedAt)}`}
                      </span>
                    )}
                    {!arrived && (
                      <span className="text-[10px] font-mono text-slate-600">待执行</span>
                    )}
                  </div>
                  <div className={`text-sm font-medium ${arrived ? 'text-white' : 'text-slate-400'}`}>
                    {stop.address}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-3">
                    <span>{stop.contactName}</span>
                    <span>{stop.contactPhone}</span>
                    {stop.weightDiffKg !== undefined && (
                      <span className={stop.weightDiffKg !== 0 ? 'text-signal-yellow' : 'text-signal-green'}>
                        重量差 {stop.weightDiffKg > 0 ? '+' : ''}{stop.weightDiffKg}kg
                      </span>
                    )}
                    {stop.signedBy && (
                      <span className="text-signal-cyan">签收: {stop.signedBy}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default OrderTimeline;
