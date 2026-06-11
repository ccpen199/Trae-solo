import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

export function GlassCard({ children, className, hoverGlow = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-glass backdrop-blur-xl border border-white/5 rounded-4xl shadow-card',
        hoverGlow && 'transition-all duration-300 hover:border-white/10 hover:shadow-glow-blue hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}
