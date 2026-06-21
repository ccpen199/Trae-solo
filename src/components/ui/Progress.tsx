import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { calculateProgressColor } from '@/utils/formatters';

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Progress({
  value,
  max = 100,
  showLabel = true,
  label,
  size = 'md',
  color,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const progressColor = color || calculateProgressColor(percentage);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-gray-900">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={cn('h-full rounded-full', progressColor)}
        />
      </div>
    </div>
  );
}
