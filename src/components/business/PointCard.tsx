import { motion } from 'framer-motion';
import { Check, ArrowRight, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PointTask } from '@/types';
import Button from '@/components/common/Button';

interface PointCardProps {
  task: PointTask;
  className?: string;
  onAction?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  daily: 'bg-westlake-100 text-westlake-700',
  weekly: 'bg-honghua-100 text-honghua-700',
  one_time: 'bg-chaojing-100 text-chaojing-700',
};

const typeLabels: Record<string, string> = {
  daily: '每日任务',
  weekly: '每周任务',
  one_time: '新手任务',
};

export default function PointCard({ task, className, onAction }: PointCardProps) {
  const handleAction = () => {
    if (!task.completed) {
      onAction?.(task.id);
    }
  };

  const progress = task.progress !== undefined && task.target !== undefined
    ? Math.min((task.progress / task.target) * 100, 100)
    : undefined;

  return (
    <motion.div
      className={cn(
        'bg-white rounded-card shadow-card p-4',
        task.completed && 'opacity-75',
        className
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{task.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-neutral-800 line-clamp-1">{task.name}</h4>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              typeColors[task.type]
            )}>
              {typeLabels[task.type]}
            </span>
          </div>

          <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{task.description}</p>

          {progress !== undefined && !task.completed && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>进度</span>
                <span>{task.progress}/{task.target}</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-chaojing-400 to-chaojing-500 rounded-full"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-chaojing-600">
              <Coins className="w-4 h-4" />
              <span className="font-bold">+{task.points}</span>
              <span className="text-xs text-neutral-400">积分</span>
            </div>

            {task.completed ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-honghua-600 text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                已完成
              </motion.div>
            ) : (
              <Button
                variant={progress !== undefined && progress > 0 ? 'warning' : 'primary'}
                size="sm"
                onClick={handleAction}
              >
                {task.action}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
