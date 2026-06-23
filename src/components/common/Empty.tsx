import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function Empty({ description = '暂无数据', icon: Icon = Inbox, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <Icon className="h-16 w-16 text-gray-300" />
      <p className="mt-4 text-sm text-gray-500">{description}</p>
    </div>
  );
}
