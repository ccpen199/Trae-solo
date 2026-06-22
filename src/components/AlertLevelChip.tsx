import { AlertTriangle, Info, AlertCircle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertLevel = 'blue' | 'yellow' | 'orange' | 'red';

const levelConfig = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    icon: Info,
    label: '蓝色',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    icon: AlertCircle,
    label: '黄色',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
    label: '橙色',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    icon: Flame,
    label: '红色',
  },
};

interface AlertLevelChipProps {
  level: AlertLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  pulse?: boolean;
}

export default function AlertLevelChip({
  level,
  showIcon = true,
  size = 'md',
  label,
  className,
  pulse = false,
}: AlertLevelChipProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        pulse && 'animate-pulse',
        className,
      )}
    >
      {showIcon && (
        <span className={cn('relative flex items-center justify-center', pulse && config.dot)}>
          <Icon className={cn(iconSize[size])} />
          {pulse && (
            <span className={cn('absolute w-full h-full rounded-full animate-ping opacity-75', config.dot)} />
          )}
        </span>
      )}
      {label || `${config.label}预警`}
    </span>
  );
}
