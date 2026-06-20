import React from 'react';
import { cn } from '@/lib/utils';
import type { ScheduleStatus } from '@shared/types';

interface ScheduleDayProps {
  date: Date;
  status?: ScheduleStatus;
  isSelected?: boolean;
  isToday?: boolean;
  isOutsideMonth?: boolean;
  onClick?: () => void;
  className?: string;
}

const statusColors: Record<ScheduleStatus, string> = {
  available: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  booked: 'bg-red-500/20 border-red-500/50 text-red-400',
  pending: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  unavailable: 'bg-midnight-600/50 border-midnight-500/50 text-midnight-400',
};

const statusDotColors: Record<ScheduleStatus, string> = {
  available: 'bg-emerald-500',
  booked: 'bg-red-500',
  pending: 'bg-amber-500',
  unavailable: 'bg-midnight-400',
};

const ScheduleDay: React.FC<ScheduleDayProps> = ({
  date,
  status,
  isSelected = false,
  isToday = false,
  isOutsideMonth = false,
  onClick,
  className,
}) => {
  const dayNumber = date.getDate();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square flex flex-col items-center justify-center rounded-xl border transition-all duration-300 ease-out-expo',
        'hover:scale-105 hover:shadow-lg',
        isOutsideMonth && 'opacity-40 pointer-events-none',
        isSelected
          ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-midnight-800 scale-105'
          : '',
        status
          ? statusColors[status]
          : 'bg-midnight-800/50 border-midnight-700 text-midnight-200 hover:bg-midnight-700/50 hover:border-midnight-600',
        className
      )}
    >
      <span
        className={cn(
          'text-sm font-medium',
          isToday && 'text-rose-400 font-bold'
        )}
      >
        {dayNumber}
      </span>
      {status && (
        <span
          className={cn(
            'absolute bottom-1.5 w-1.5 h-1.5 rounded-full',
            statusDotColors[status]
          )}
        />
      )}
      {isToday && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      )}
    </button>
  );
};

export default ScheduleDay;
