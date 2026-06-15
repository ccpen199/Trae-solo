import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'accent' | 'secondary';
  };
  className?: string;
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {icon && (
        <div className="mb-6 p-4 bg-zinc-100 rounded-full">
          <div className="text-zinc-400 w-12 h-12 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}
      <h3 className="font-display text-xl font-bold text-zinc-800 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-zinc-500 text-sm max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
