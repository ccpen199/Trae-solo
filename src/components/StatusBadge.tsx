import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, XCircle, Info, Minus } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
};

const StatusIcon = ({ variant }: { variant: StatusVariant }) => {
  const styles = variantStyles[variant];
  switch (variant) {
    case 'success':
      return <CheckCircle2 className={cn('w-3.5 h-3.5', styles.icon)} />;
    case 'warning':
      return <AlertCircle className={cn('w-3.5 h-3.5', styles.icon)} />;
    case 'danger':
      return <XCircle className={cn('w-3.5 h-3.5', styles.icon)} />;
    case 'info':
      return <Info className={cn('w-3.5 h-3.5', styles.icon)} />;
    default:
      return <Minus className={cn('w-3.5 h-3.5', styles.icon)} />;
  }
};

export default function StatusBadge({
  variant = 'default',
  children,
  icon = false,
  className,
}: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
        styles.bg,
        styles.text,
        className
      )}
    >
      {icon && <StatusIcon variant={variant} />}
      {children}
    </span>
  );
}
