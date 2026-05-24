import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

export default function Empty({ message = '暂无数据', icon: Icon, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && <Icon className="w-12 h-12 text-neutral-300 mb-4" />}
      <p className="text-neutral-500">{message}</p>
    </div>
  );
}
