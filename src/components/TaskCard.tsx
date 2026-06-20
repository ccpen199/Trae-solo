import React from 'react';
import { MapPin, Clock, Package, Scale, Eye, Play, CheckSquare } from 'lucide-react';
import type { PickupTask } from 'shared/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface TaskCardProps {
  task: PickupTask;
  onViewDetail: (task: PickupTask) => void;
  onStartPickup?: (task: PickupTask) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (taskId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetail,
  onStartPickup,
  selectable = false,
  selected = false,
  onSelect,
  className,
  style,
}) => {
  const canStartPickup = task.status === 'assigned' || task.status === 'pending';

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-slide-up',
        selected && 'ring-2 ring-primary border-primary',
        !task.synced && 'border-orange-300 bg-orange-50/30',
        className
      )}
      style={style}
    >
      {selectable && (
        <button
          onClick={() => onSelect?.(task.id)}
          className={cn(
            'absolute top-4 left-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors z-10',
            selected
              ? 'bg-primary border-primary text-white'
              : 'border-gray-300 hover:border-primary'
          )}
        >
          {selected && <CheckSquare className="w-4 h-4" />}
        </button>
      )}

      {!task.synced && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
          待同步
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(selectable && 'pl-10')}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-semibold text-primary">
                {task.pickupCode}
              </span>
              <StatusBadge status={task.status} size="sm" type="task" />
            </div>
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              {task.taskNo}
            </h4>
          </div>
          {task.courierName && (
            <div className="text-right">
              <p className="text-xs text-gray-500">快递员</p>
              <p className="text-sm font-medium text-gray-700">{task.courierName}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">{task.senderAddress}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              {dayjs(task.appointmentTime).format('YYYY-MM-DD HH:mm')}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{task.itemType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {task.actualWeight ?? task.estimatedWeight} kg
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          {task.freight !== undefined && (
            <p className="text-lg font-bold text-primary">¥{task.freight.toFixed(2)}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onViewDetail(task)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              查看详情
            </button>
            {onStartPickup && canStartPickup && (
              <button
                onClick={() => onStartPickup(task)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                开始揽收
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
