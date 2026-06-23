import { cn } from '@/lib/utils';

type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'gray';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  primary: 'bg-primary text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  danger: 'bg-red-500 text-white',
  gray: 'bg-gray-500 text-white',
};

export function Badge({ color = 'primary', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}
