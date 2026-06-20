import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  hoverable?: boolean;
  padding?: CardPadding;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  gradientBorder?: boolean;
}

const Card = ({ className, hoverable = false, padding = 'md', children, header, footer, gradientBorder = false, ...props }: CardProps) => {
  const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card transition-all duration-300',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
        gradientBorder && 'relative p-px bg-gradient-to-r from-primary-500 via-mint-400 to-accent-400',
        className
      )}
      {...props}
    >
      <div className={cn(
        'bg-white rounded-xl h-full flex flex-col',
        paddingStyles[padding]
      )}>
        {header && (
          <div className={cn(
            'border-b border-neutral-200',
            padding !== 'none' && '-mx-5 -mt-5 px-5 py-4 mb-5'
          )}>
            {header}
          </div>
        )}
        <div className="flex-1">{children}</div>
        {footer && (
          <div className={cn(
            'border-t border-neutral-200',
            padding !== 'none' && '-mx-5 -mb-5 px-5 py-4 mt-5'
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export { Card };
export type { CardProps, CardPadding };
