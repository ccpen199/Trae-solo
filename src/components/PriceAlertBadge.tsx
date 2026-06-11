import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceAlertBadgeProps {
  deviation: number;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function PriceAlertBadge({
  deviation,
  showIcon = true,
  size = 'sm',
  className,
}: PriceAlertBadgeProps) {
  const isOverpriced = deviation > 0;
  const isUnderpriced = deviation < 0;
  const absDeviation = Math.abs(deviation);

  const getSeverity = () => {
    if (absDeviation >= 20) return 'critical';
    if (absDeviation >= 10) return 'high';
    if (absDeviation >= 5) return 'medium';
    return 'low';
  };

  const severity = getSeverity();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const getLabel = () => {
    if (isOverpriced) {
      return `高于均价 ${absDeviation.toFixed(1)}%`;
    }
    if (isUnderpriced) {
      return `低于均价 ${absDeviation.toFixed(1)}%`;
    }
    return '价格正常';
  };

  if (absDeviation < 5) {
    return null;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        sizeClasses[size],
        isOverpriced &&
          severity === 'critical' &&
          'bg-accent-up/20 text-accent-up animate-pulse',
        isOverpriced &&
          severity === 'high' &&
          'bg-accent-up/15 text-accent-up',
        isOverpriced &&
          severity === 'medium' &&
          'bg-accent-up/10 text-accent-up',
        isUnderpriced &&
          severity === 'critical' &&
          'bg-accent-down/20 text-accent-down animate-pulse',
        isUnderpriced &&
          severity === 'high' &&
          'bg-accent-down/15 text-accent-down',
        isUnderpriced &&
          severity === 'medium' &&
          'bg-accent-down/10 text-accent-down',
        className
      )}
    >
      {showIcon && (
        <>
          {severity === 'critical' && (
            <AlertTriangle className={cn(iconSize, 'animate-pulse')} />
          )}
          {isOverpriced && severity !== 'critical' && (
            <TrendingUp className={iconSize} />
          )}
          {isUnderpriced && severity !== 'critical' && (
            <TrendingDown className={iconSize} />
          )}
        </>
      )}
      {getLabel()}
    </motion.span>
  );
}
