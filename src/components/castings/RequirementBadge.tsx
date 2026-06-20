import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RequirementType = 'gender' | 'age' | 'height' | 'weight' | 'skill' | 'language' | 'experience' | 'other';
export type RequirementStatus = 'match' | 'mismatch' | 'neutral';

export interface RequirementBadgeProps {
  label: string;
  type?: RequirementType;
  status?: RequirementStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const typeColors: Record<RequirementType, string> = {
  gender: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  age: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  height: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  weight: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  skill: 'bg-sapphire-500/15 text-sapphire-400 border-sapphire-500/30',
  language: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  experience: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  other: 'bg-midnight-700 text-midnight-300 border-midnight-600',
};

const statusIcon = {
  match: <Check className="w-3 h-3" />,
  mismatch: <X className="w-3 h-3" />,
  neutral: null,
};

const statusBorderColors: Record<RequirementStatus, string> = {
  match: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  mismatch: 'border-red-500/50 bg-red-500/10 text-red-400',
  neutral: '',
};

const RequirementBadge: React.FC<RequirementBadgeProps> = ({
  label,
  type = 'other',
  status = 'neutral',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        status === 'neutral' ? typeColors[type] : statusBorderColors[status],
        sizeClasses[size],
        className
      )}
    >
      {statusIcon[status]}
      {label}
    </span>
  );
};

export default RequirementBadge;
