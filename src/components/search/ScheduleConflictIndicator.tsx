import React, { useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { ScheduleConflict } from '@shared/types';

interface ScheduleConflictIndicatorProps {
  conflicts: ScheduleConflict[];
  compact?: boolean;
  className?: string;
}

const getConflictTypeInfo = (type: ScheduleConflict['type']) => {
  switch (type) {
    case 'schedule_booked':
      return {
        label: '档期冲突',
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: 'danger' as const,
      };
    case 'location_mismatch':
      return {
        label: '位置不符',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        color: 'warning' as const,
      };
    case 'contract_restriction':
      return {
        label: '合同限制',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        color: 'warning' as const,
      };
    default:
      return {
        label: '未知冲突',
        icon: <Info className="w-3.5 h-3.5" />,
        color: 'default' as const,
      };
  }
};

const ScheduleConflictIndicator: React.FC<ScheduleConflictIndicatorProps> = ({
  conflicts,
  compact = false,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (conflicts.length === 0) {
    if (compact) {
      return (
        <Badge variant="success" size="sm" dot className={className}>
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          档期可用
        </Badge>
      );
    }
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30',
          className
        )}
      >
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">档期可用</span>
      </div>
    );
  }

  const hasSevereConflicts = conflicts.some((c) => c.type === 'schedule_booked');
  const conflictCount = conflicts.length;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105',
            hasSevereConflicts
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
            className
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {conflictCount} 个冲突
        </button>

        {showDetails && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDetails(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 animate-scale-in">
              <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-xl p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-midnight-700">
                  <span className="font-medium text-white text-sm">档期冲突详情</span>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-midnight-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {conflicts.map((conflict, index) => {
                  const info = getConflictTypeInfo(conflict.type);
                  return (
                    <div
                      key={index}
                      className="p-2 rounded-lg bg-midnight-900/50 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={info.color} size="sm" dot>
                          {info.icon}
                          {info.label}
                        </Badge>
                        <span className="text-xs text-midnight-400">
                          {format(new Date(conflict.date), 'MM月dd日', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-xs text-midnight-300 pl-5">
                        {conflict.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-xl border',
          hasSevereConflicts
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        )}
      >
        <AlertTriangle
          className={cn(
            'w-5 h-5 shrink-0',
            hasSevereConflicts ? 'text-red-400' : 'text-amber-400'
          )}
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-sm',
              hasSevereConflicts ? 'text-red-400' : 'text-amber-400'
            )}
          >
            发现 {conflictCount} 个档期冲突
          </p>
          <p className="text-xs text-midnight-400 mt-0.5">
            {hasSevereConflicts
              ? '存在已预约档期，可能无法参与'
              : '存在潜在冲突，建议进一步确认'}
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-2">
        {conflicts.map((conflict, index) => {
          const info = getConflictTypeInfo(conflict.type);
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-midnight-800/50 border border-midnight-700/50"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  conflict.type === 'schedule_booked'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                )}
              >
                {info.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={info.color} size="sm">
                    {info.label}
                  </Badge>
                  <span className="text-xs text-midnight-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(conflict.date), 'yyyy年MM月dd日', { locale: zhCN })}
                  </span>
                </div>
                <p className="text-sm text-midnight-200">{conflict.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleConflictIndicator;
