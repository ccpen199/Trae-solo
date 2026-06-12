import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    'bg-amber-orange text-white hover:bg-amber-orange-light focus:ring-amber-orange/50 active:bg-amber-orange-dark shadow-glow hover:shadow-glow-md',
  secondary:
    'bg-deep-sea-light/50 text-slate-200 border border-deep-sea-light/50 hover:bg-deep-sea-light hover:text-white focus:ring-deep-sea-light/50',
  ghost:
    'bg-transparent text-slate-300 hover:bg-deep-sea-light/30 hover:text-white focus:ring-deep-sea-light/30',
  danger:
    'bg-mood-coral/20 text-mood-coral border border-mood-coral/30 hover:bg-mood-coral/30 focus:ring-mood-coral/30',
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const iconOnlySizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconOnly = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep-sea-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        'active:translate-y-0.5',
        variantMap[variant],
        iconOnly ? iconOnlySizeMap[size] : sizeMap[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {!iconOnly && <span>{children}</span>}
    </button>
  );
}
