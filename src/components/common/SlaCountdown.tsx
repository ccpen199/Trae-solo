import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

export type SlaStatus = 'normal' | 'warning' | 'danger' | 'overdue' | 'completed';

interface SlaCountdownProps {
  deadline: string | Date;
  startTime?: string | Date;
  completed?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onStatusChange?: (status: SlaStatus) => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(deadline: string | Date): TimeLeft {
  const now = dayjs();
  const diff = dayjs(deadline).diff(now);

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: diff };
}

function getStatus(timeLeft: TimeLeft, completed: boolean): SlaStatus {
  if (completed) return 'completed';
  if (timeLeft.total <= 0) return 'overdue';
  if (timeLeft.total <= 30 * 60 * 1000) return 'danger';
  if (timeLeft.total <= 2 * 60 * 60 * 1000) return 'warning';
  return 'normal';
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

export function SlaCountdown({
  deadline,
  completed = false,
  showIcon = true,
  size = 'md',
  className,
  onStatusChange,
}: SlaCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(deadline)
  );

  const status = getStatus(timeLeft, completed);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (completed) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(deadline);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, completed]);

  const statusConfig = {
    normal: {
      text: 'text-success-400',
      bg: 'bg-success-500/10',
      border: 'border-success-500/20',
      icon: Clock,
      label: '正常',
      animate: false,
    },
    warning: {
      text: 'text-warning-400',
      bg: 'bg-warning-500/10',
      border: 'border-warning-500/20',
      icon: Clock,
      label: '即将超时',
      animate: false,
    },
    danger: {
      text: 'text-danger-400',
      bg: 'bg-danger-500/10',
      border: 'border-danger-500/30',
      icon: AlertTriangle,
      label: '临近超时',
      animate: true,
    },
    overdue: {
      text: 'text-danger-500',
      bg: 'bg-danger-500/15',
      border: 'border-danger-500/40',
      icon: XCircle,
      label: '已超时',
      animate: false,
    },
    completed: {
      text: 'text-success-400',
      bg: 'bg-success-500/10',
      border: 'border-success-500/20',
      icon: CheckCircle2,
      label: '已完成',
      animate: false,
    },
  }[status];

  const Icon = statusConfig.icon;

  const sizeConfig = {
    sm: {
      wrapper: 'px-2 py-1 text-xs',
      num: 'text-xs',
      icon: 'w-3.5 h-3.5',
      timeBlock: 'px-1.5 py-0.5',
    },
    md: {
      wrapper: 'px-3 py-1.5 text-sm',
      num: 'text-sm',
      icon: 'w-4 h-4',
      timeBlock: 'px-2 py-0.5',
    },
    lg: {
      wrapper: 'px-4 py-2 text-base',
      num: 'text-base',
      icon: 'w-5 h-5',
      timeBlock: 'px-2.5 py-1',
    },
  }[size];

  if (completed) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border font-medium',
          sizeConfig.wrapper,
          statusConfig.bg,
          statusConfig.border,
          statusConfig.text,
          className
        )}
      >
        {showIcon && <Icon className={sizeConfig.icon} />}
        <span>{statusConfig.label}</span>
      </div>
    );
  }

  if (status === 'overdue') {
    const overdueTime = dayjs(deadline);
    const now = dayjs();
    const overdueHours = Math.floor(now.diff(overdueTime) / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);
    const displayOverdue = overdueDays > 0 ? `${overdueDays}天${overdueHours % 24}小时` : `${overdueHours}小时`;

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border font-medium',
          sizeConfig.wrapper,
          statusConfig.bg,
          statusConfig.border,
          statusConfig.text,
          className
        )}
      >
        {showIcon && <Icon className={sizeConfig.icon} />}
        <span>已超时 {displayOverdue}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border font-medium backdrop-blur-sm',
        sizeConfig.wrapper,
        statusConfig.bg,
        statusConfig.border,
        statusConfig.text,
        statusConfig.animate && 'animate-breathe',
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, status === 'danger' && 'animate-pulse')} />}
      <div className="flex items-center gap-1 font-mono">
        {timeLeft.days > 0 && (
          <>
            <span className={cn(sizeConfig.timeBlock, 'rounded bg-white/10')}>
              {pad(timeLeft.days)}
            </span>
            <span className="opacity-60">天</span>
          </>
        )}
        <span className={cn(sizeConfig.timeBlock, 'rounded bg-white/10')}>
          {pad(timeLeft.hours)}
        </span>
        <span className="opacity-60">:</span>
        <span className={cn(sizeConfig.timeBlock, 'rounded bg-white/10')}>
          {pad(timeLeft.minutes)}
        </span>
        <span className="opacity-60">:</span>
        <span className={cn(sizeConfig.timeBlock, 'rounded bg-white/10')}>
          {pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}
