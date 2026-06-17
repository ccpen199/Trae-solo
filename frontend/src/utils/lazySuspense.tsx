import React, { Suspense, ComponentType } from 'react';

interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className = '' }: PageSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export function lazySuspense<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(factory);
  return function LazySuspenseWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<PageSkeleton className="p-4 md:p-6" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
