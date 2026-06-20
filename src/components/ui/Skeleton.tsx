import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-cloud-200 via-cloud-100 to-cloud-200 bg-[length:200%_100%]';

  const variants = {
    text: 'h-4 rounded w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-2xl h-64 w-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={style}
      {...props}
    />
  );
};

const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={cn('card p-0 overflow-hidden', className)}>
      <Skeleton variant="rectangular" height={200} className="rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <div className="flex gap-2 pt-2">
          <Skeleton variant="text" width={60} height={24} className="rounded-full" />
          <Skeleton variant="text" width={60} height={24} className="rounded-full" />
          <Skeleton variant="text" width={60} height={24} className="rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={100} />
        </div>
      </div>
    </div>
  );
};

export { Skeleton, SkeletonText, SkeletonCard };
export default Skeleton;
