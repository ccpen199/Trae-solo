import { CheckCircle2, Clock, Circle, UserCheck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  status: 'submitted' | 'assigned' | 'processing' | 'completed' | 'closed';
  title: string;
  description?: string;
  time: string;
  operator?: string;
}

const statusConfig = {
  submitted: { icon: Circle, color: 'bg-gov-500', textColor: 'text-gov-600', label: '已提交' },
  assigned: { icon: UserCheck, color: 'bg-blue-500', textColor: 'text-blue-600', label: '已派单' },
  processing: { icon: Package, color: 'bg-warm-500', textColor: 'text-warm-600', label: '处理中' },
  completed: { icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-600', label: '已完成' },
  closed: { icon: Clock, color: 'bg-gray-500', textColor: 'text-gray-600', label: '已归档' },
};

interface WorkOrderTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export default function WorkOrderTimeline({ events, className }: WorkOrderTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>暂无进度记录</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 md:left-5 top-2 bottom-2 w-0.5 bg-gray-100" />
      <div className="space-y-6">
        {events.map((event, idx) => {
          const config = statusConfig[event.status];
          const Icon = config.icon;
          const isLast = idx === events.length - 1;
          const isFirst = idx === 0;
          return (
            <div key={event.id} className="relative flex gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div
                className={cn(
                  'relative z-10 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center',
                  config.color,
                  'text-white flex-shrink-0 shadow-md',
                  isFirst && 'ring-4 ring-opacity-20 ring-gov-400 animate-pulse-slow',
                )}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div
                className={cn(
                  'flex-1 pb-2',
                  !isLast && 'border-b border-gray-50',
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">{event.title}</h4>
                  <span className={cn('chip bg-opacity-10', config.color, config.textColor)}>
                    {config.label}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{event.time}</span>
                  {event.operator && <span>处理人：{event.operator}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
