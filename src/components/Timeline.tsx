import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  extra?: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  mode?: 'vertical' | 'horizontal';
}

const statusConfig: Record<TimelineItem['status'], { icon: ReactNode; colorClass: string; dotClass: string; lineClass: string }> = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: 'text-emerald-600',
    dotClass: 'bg-emerald-500',
    lineClass: 'bg-emerald-200',
  },
  current: {
    icon: <Clock className="h-4 w-4" />,
    colorClass: 'text-blue-600',
    dotClass: 'bg-blue-500',
    lineClass: 'bg-blue-200',
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    colorClass: 'text-slate-400',
    dotClass: 'bg-slate-300',
    lineClass: 'bg-slate-200',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    colorClass: 'text-red-600',
    dotClass: 'bg-red-500',
    lineClass: 'bg-red-200',
  },
};

const colorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-violet-600',
};

export default function Timeline({ items, className, mode = 'vertical' }: TimelineProps) {
  if (mode === 'horizontal') {
    return (
      <div className={cn('flex items-start justify-between', className)}>
        {items.map((item, index) => {
          const config = statusConfig[item.status];
          const colorClass = item.color ? colorMap[item.color] : config.colorClass;
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="relative flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                    colorClass,
                    item.status === 'completed' || item.status === 'error' ? config.dotClass + ' text-white' : 'bg-white',
                    item.status === 'current' ? 'ring-4 ring-blue-100' : '',
                    item.status === 'pending' ? 'border-2 border-dashed' : ''
                  )}
                >
                  {config.icon}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'h-0.5 flex-1',
                      item.status === 'completed' ? config.lineClass : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={cn('text-sm font-medium', item.status === 'pending' ? 'text-slate-400' : 'text-slate-900')}>
                  {item.title}
                </div>
                {item.description && (
                  <div className="mt-0.5 text-xs text-slate-500">{item.description}</div>
                )}
                {item.time && <div className="mt-0.5 text-xs text-slate-400">{item.time}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const config = statusConfig[item.status];
        const colorClass = item.color ? colorMap[item.color] : config.colorClass;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-3 top-8 h-full w-0.5',
                  item.status === 'completed' || item.status === 'error'
                    ? config.lineClass
                    : 'bg-slate-200'
                )}
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                colorClass,
                item.status === 'completed' || item.status === 'error' ? config.dotClass + ' text-white' : 'bg-white',
                item.status === 'current' ? 'ring-4 ring-blue-100' : '',
                item.status === 'pending' ? 'border-2 border-dashed border-slate-300' : ''
              )}
            >
              {config.icon}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', item.status === 'pending' ? 'text-slate-400' : 'text-slate-900')}>
                  {item.title}
                </span>
                {item.time && <span className="text-xs text-slate-400">{item.time}</span>}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              )}
              {item.extra && <div className="mt-2">{item.extra}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
