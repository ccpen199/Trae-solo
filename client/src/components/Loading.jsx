import React from 'react';

export default function Loading({ size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizes[size]}`}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}

export function ButtonLoading({ children = '加载中...' }) {
  return (
    <span className="flex items-center gap-2">
      <Loading size="sm" />
      {children}
    </span>
  );
}
