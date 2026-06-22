import { Check, Clock, MapPin, Bike, Package, Circle } from 'lucide-react';
import { Order } from '../../types';

interface StatusTimelineProps {
  order: Order;
}

type TimelineNode = {
  key: string;
  label: string;
  icon: React.ReactNode;
  timeKey?: keyof Order;
  done: boolean;
  current: boolean;
};

function buildNodes(order: Order): TimelineNode[] {
  const statusProgress: Record<string, number> = {
    pending_pay: 0,
    pending_accept: 1,
    picking: 2,
    delivering: 3,
    completed: 5,
    cancelled: 0,
    fused: 1,
  };
  const progress = statusProgress[order.status] ?? 0;

  const rawNodes: Omit<TimelineNode, 'done' | 'current'>[] = [
    { key: 'created', label: '订单发布', icon: <Clock size={14} />, timeKey: 'createdAt' },
    { key: 'accepted', label: '骑手接单', icon: <Bike size={14} />, timeKey: 'acceptedAt' },
    { key: 'picked', label: '已取货', icon: <Package size={14} />, timeKey: 'pickedAt' },
    { key: 'delivered', label: '已送达', icon: <MapPin size={14} />, timeKey: 'deliveredAt' },
    { key: 'finished', label: '订单完成', icon: <Check size={14} /> },
  ];

  return rawNodes.map((n, i) => {
    const step = i + 1;
    return {
      ...n,
      done: progress > step,
      current: progress === step,
    };
  });
}

export default function StatusTimeline({ order }: StatusTimelineProps) {
  const nodes = buildNodes(order);

  return (
    <div className="relative py-2">
      <div className="space-y-0">
        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;
          const nodeColor = node.done ? '#00C48C' : node.current ? '#1E40FF' : '#475569';
          const bgColor = node.done ? 'bg-success' : node.current ? 'bg-primary' : 'bg-white/10';
          const timeStr = node.timeKey ? ((order[node.timeKey] as unknown) as Date | undefined) : undefined;
          const timeText = timeStr
            ? (() => {
                const d = timeStr instanceof Date ? timeStr : new Date(timeStr);
                return isNaN(d.getTime())
                  ? ''
                  : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              })()
            : '';

          return (
            <div key={node.key} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <div
                  className="absolute left-[17px] top-[34px] w-px h-[calc(100%-24px)] overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className={`w-full transition-all duration-700 ${node.done ? 'h-full' : 'h-0'}`}
                    style={{
                      background: node.current
                        ? 'linear-gradient(180deg, #1E40FF, #60A5FA, #1E40FF)'
                        : '#00C48C',
                      backgroundSize: node.current ? '100% 200%' : undefined,
                      animation: node.current ? 'timeline-flow 2s linear infinite' : undefined,
                    }}
                  />
                </div>
              )}

              <div className="relative z-10 shrink-0">
                {node.current ? (
                  <div className="relative w-9 h-9 rounded-full flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: nodeColor,
                        animation: 'timeline-pulse-ring 1.6s ease-out infinite',
                        opacity: 0.4,
                      }}
                    />
                    <div
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${bgColor}`}
                      style={{ boxShadow: `0 0 0 4px rgba(30,64,255,0.15)` }}
                    >
                      <Circle size={10} className="text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${bgColor} ${
                      node.done ? 'shadow-lg shadow-success/25' : 'border border-white/15'
                    }`}
                  >
                    {node.done ? (
                      <Check size={16} className="text-white font-bold" strokeWidth={3} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 pt-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        node.current ? 'text-white' : node.done ? 'text-white/90' : 'text-white/40'
                      }`}
                    >
                      {node.label}
                    </div>
                    {node.current && (
                      <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                          style={{ animation: 'dot-blink 1s ease-in-out infinite' }}
                        />
                        进行中
                      </div>
                    )}
                    {node.done && !timeText && (
                      <div className="text-xs text-success/80 mt-0.5">已完成</div>
                    )}
                  </div>
                  {timeText && (
                    <div
                      className={`text-xs shrink-0 tabular-nums ${
                        node.done ? 'text-white/60' : node.current ? 'text-primary' : 'text-white/30'
                      }`}
                    >
                      {timeText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes timeline-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes timeline-flow {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
