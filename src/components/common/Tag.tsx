import { cn } from '@/lib/utils';

type TagColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface TagProps {
  color?: TagColor;
  children: React.ReactNode;
  className?: string;
}

const colorStyles: Record<TagColor, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Tag({ color = 'default', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}
