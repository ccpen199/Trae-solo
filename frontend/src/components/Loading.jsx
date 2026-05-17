import { Loader } from 'lucide-react';
import { cn } from '@/utils';

export default function Loading({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <Loader className={cn('animate-spin text-primary', sizeMap[size], className)} />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <Loading size="xl" />
    </div>
  );
}
