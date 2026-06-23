import { Inbox, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  title = '暂无数据',
  description = '暂无相关数据，请添加后再查看',
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 mb-5">
        <Icon className="w-10 h-10 text-gray-300" />
      </div>

      <h3 className="text-base font-semibold text-gray-700 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
