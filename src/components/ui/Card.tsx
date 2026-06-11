import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padding = 'md',
  className,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card border border-neutral-100 transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
