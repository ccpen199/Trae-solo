import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type LoadingType = 'spinner' | 'skeleton' | 'pulse';

interface LoadingProps {
  type?: LoadingType;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  spinner: {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  },
};

interface SkeletonProps {
  lines?: number;
  shape?: 'rect' | 'circle' | 'text';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  lines = 1,
  shape = 'rect',
  width,
  height,
  className,
}: SkeletonProps) {
  if (shape === 'circle') {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
          width || 'w-12',
          height || 'h-12',
          className
        )}
      />
    );
  }

  if (shape === 'text' || lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 rounded-md bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
              i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
        width || 'w-full',
        height || 'h-32',
        className
      )}
    />
  );
}

export default function Loading({
  type = 'spinner',
  size = 'md',
  text,
  className,
}: LoadingProps) {
  if (type === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <motion.div
          className={cn(
            'rounded-full border-transparent border-t-westlake-500 border-r-westlake-500 animate-spin',
            sizeClasses.spinner[size]
          )}
        />
        {text && <p className="text-sm text-neutral-500">{text}</p>}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={cn(
            'rounded-full bg-gradient-to-br from-westlake-400 to-westlake-600',
            size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'
          )}
        />
        {text && <p className="text-sm text-neutral-500">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <Skeleton lines={3} />
    </div>
  );
}
