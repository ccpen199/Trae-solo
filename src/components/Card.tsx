import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        hover && 'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
};
