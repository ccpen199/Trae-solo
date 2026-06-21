import { type ReactNode } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      <div className="w-20 h-20 mb-6 rounded-full bg-rice-100 flex items-center justify-center border border-gold-200">
        {icon ?? <Package className="w-10 h-10 text-gold-500" />}
      </div>
      <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-jade-500 mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
