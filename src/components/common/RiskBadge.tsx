import React from 'react';
import { RiskLevel } from '@/types';
import { RISK_LEVEL_CONFIG } from '@/constants';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, AlertCircle, Skull } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

const iconMap = {
  low: Shield,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: Skull,
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false, size = 'md' }) => {
  const config = RISK_LEVEL_CONFIG[level];
  const Icon = iconMap[level];

  return (
    <span className={cn(
      'lc-badge gap-1',
      config.className,
      size === 'sm' ? 'text-xs py-0.5 px-2' : ''
    )}>
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-semibold ml-1">{score}</span>
      )}
    </span>
  );
};

export default RiskBadge;
