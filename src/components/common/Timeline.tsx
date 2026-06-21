import { ReactNode } from 'react';
import { Check, Clock, AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimelineStatus = 'success' | 'processing' | 'warning' | 'danger';

interface TimelineItem {
  time: string;
  title: string;
  description?: string;
  status?: TimelineStatus;
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

// 状态颜色配置
const statusConfig: Record<
  TimelineStatus,
  { dot: string; ring: string; line: string; iconBg: string; iconColor: string }
> = {
  success: {
    dot: 'bg-success-500',
    ring: 'ring-success-200',
    line: 'bg-success-300',
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
  },
  processing: {
    dot: 'bg-brand-500',
    ring: 'ring-brand-200',
    line: 'bg-brand-300',
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
  },
  warning: {
    dot: 'bg-warning-500',
    ring: 'ring-warning-200',
    line: 'bg-warning-300',
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
  },
  danger: {
    dot: 'bg-danger-500',
    ring: 'ring-danger-200',
    line: 'bg-danger-300',
    iconBg: 'bg-danger-100',
    iconColor: 'text-danger-600',
  },
};

// 默认状态图标
function getDefaultIcon(status: TimelineStatus) {
  switch (status) {
    case 'success':
      return <Check className="h-3.5 w-3.5" />;
    case 'processing':
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case 'danger':
      return <X className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}

export default function Timeline({ items, className }: TimelineProps) {
  if (!items || items.length === 0) return null;

  return (
    <ul className={cn('space-y-5', className)}>
      {items.map((item, index) => {
        const status: TimelineStatus = item.status || 'processing';
        const config = statusConfig[status];
        const isLast = index === items.length - 1;

        return (
          <li key={index} className="relative flex gap-4">
            {/* 左侧时间点和连接线 */}
            <div className="relative flex flex-col items-center">
              {/* 状态圆点 */}
              <div
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4',
                  config.iconBg,
                  config.ring,
                  status === 'processing' && 'animate-breathe'
                )}
              >
                <span className={cn('flex items-center justify-center', config.iconColor)}>
                  {item.icon || getDefaultIcon(status)}
                </span>

                {/* 处理中脉冲光晕 */}
                {status === 'processing' && (
                  <span
                    className={cn(
                      'absolute inset-0 rounded-full animate-ping opacity-40',
                      config.dot
                    )}
                  />
                )}
              </div>

              {/* 垂直连接线 */}
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 translate-y-1',
                    status === 'success' ? config.line : 'bg-ink-200'
                  )}
                  style={{ minHeight: '20px' }}
                />
              )}
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 pb-5">
              {/* 时间和标题 */}
              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <time className="text-xs font-medium text-ink-400 tabular-nums">
                  {item.time}
                </time>
                <h4 className="text-sm font-semibold text-ink-800">{item.title}</h4>
              </div>

              {/* 描述信息 */}
              {item.description && (
                <p className="text-sm leading-relaxed text-ink-500">{item.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
