import { ReactNode, CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function Card({ children, className, hover = true, glow = false, style }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'bg-gradient-to-br from-dark-800/80 to-dark-900/90 border border-dark-700/50 rounded-xl backdrop-blur-sm',
        hover && 'transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5',
        glow && 'shadow-glow-sm border-brand-500/30',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-5 py-4 border-b border-dark-700/50',
      className
    )}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-base font-semibold text-white', className)}>
      {children}
    </h3>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('p-5', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-5 py-3 border-t border-dark-700/50',
      className
    )}>
      {children}
    </div>
  );
};
