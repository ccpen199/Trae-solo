import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface QuickActionCardProps {
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function QuickActionCard({
  icon,
  iconGradient,
  title,
  description,
  onClick,
  className,
}: QuickActionCardProps) {
  return (
    <Card
      variant="glass"
      hoverable
      onClick={onClick}
      className={cn(
        'p-5 relative overflow-hidden group',
        'before:absolute before:inset-0 before:rounded-xl before:p-0.5 before:bg-gradient-to-r before:from-rose-500/0 before:via-rose-500/0 before:to-rose-500/0 before:opacity-0 before:transition-all before:duration-500 hover:before:from-rose-500/50 hover:before:via-sapphire-500/50 hover:before:to-rose-500/50 hover:before:opacity-100',
        className
      )}
    >
      <div className="relative z-10">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-r',
            iconGradient
          )}
        >
          <span className="text-white text-2xl">{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-rose-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-midnight-300 line-clamp-2">{description}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-r from-rose-500/10 to-sapphire-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
}

export default QuickActionCard;
