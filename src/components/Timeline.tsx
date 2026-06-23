import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

type TimelineStatus = 'completed' | 'current' | 'pending';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: TimelineStatus;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusStyles: Record<TimelineStatus, { dot: string; line: string; icon: string }> = {
  completed: {
    dot: 'bg-green-500 border-green-500',
    line: 'bg-green-200',
    icon: 'text-white',
  },
  current: {
    dot: 'bg-primary-600 border-primary-600 ring-4 ring-primary-100',
    line: 'bg-gray-200',
    icon: 'text-white',
  },
  pending: {
    dot: 'bg-white border-gray-300',
    line: 'bg-gray-200',
    icon: 'text-gray-400',
  },
};

const StatusIcon = ({ status }: { status: TimelineStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'current':
      return <Circle className="w-5 h-5 text-primary-600 fill-primary-600" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
};

export default function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-gray-200" />

      <ul className="space-y-6">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const styles = statusStyles[item.status];

          return (
            <li key={item.id} className="relative flex gap-4">
              <div className="relative z-10 flex-shrink-0">
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : item.status === 'current' ? (
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center ring-4 ring-primary-100">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300" />
                )}
              </div>

              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={cn(
                      'text-sm font-medium',
                      item.status === 'pending'
                        ? 'text-gray-400'
                        : 'text-gray-800'
                    )}
                  >
                    {item.title}
                  </h4>
                  {item.time && (
                    <span
                      className={cn(
                        'text-xs',
                        item.status === 'pending'
                          ? 'text-gray-300'
                          : 'text-gray-400'
                      )}
                    >
                      {item.time}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      item.status === 'pending'
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
