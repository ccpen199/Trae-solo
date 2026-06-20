import * as React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/types';

interface StatusTimelineProps {
  items: TimelineItem[];
  className?: string;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'done':
    case 'completed':
      return {
        dot: 'bg-gold-gradient border-gold-500',
        line: 'bg-gold-gradient',
        icon: <CheckCircle2 className="w-4 h-4 text-ink-950" />,
        title: 'text-ink-50',
        desc: 'text-ink-300',
        time: 'text-ink-400',
      };
    case 'active':
    case 'current':
      return {
        dot: 'bg-ink-850 border-gold-500 shadow-[0_0_15px_rgba(201,169,98,0.5)]',
        line: 'bg-ink-700',
        icon: <Clock className="w-4 h-4 text-gold-400 animate-pulse" />,
        title: 'text-gold-300',
        desc: 'text-ink-300',
        time: 'text-gold-400',
      };
    case 'pending':
    default:
      return {
        dot: 'bg-ink-800 border-ink-600',
        line: 'bg-ink-700',
        icon: <Circle className="w-3 h-3 text-ink-500" />,
        title: 'text-ink-400',
        desc: 'text-ink-500',
        time: 'text-ink-500',
      };
  }
};

const StatusTimeline: React.FC<StatusTimelineProps> = ({ items, className }) => {
  return (
    <div className={cn('relative pl-8', className)}>
      {items.map((item, index) => {
        const styles = getStatusStyles(item.status);
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="relative pb-8 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[17px] top-8 w-[2px] h-[calc(100%-2rem)]',
                  styles.line,
                )}
              />
            )}
            <div
              className={cn(
                'absolute left-0 top-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 shrink-0',
                styles.dot,
              )}
            >
              {styles.icon}
            </div>
            <div className="pt-1 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className={cn('text-sm font-semibold', styles.title)}>{item.title}</p>
                {item.time && (
                  <span className={cn('text-xs font-medium', styles.time)}>
                    {item.time}
                  </span>
                )}
              </div>
              {item.description && (
                <p className={cn('text-sm leading-relaxed', styles.desc)}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { StatusTimeline };
