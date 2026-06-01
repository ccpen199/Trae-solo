import { Star } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  source?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function ScoreBadge({ score, source, size = 'md', showIcon = true }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'from-green-500 to-emerald-500';
    if (score >= 8) return 'from-lime-500 to-green-500';
    if (score >= 7) return 'from-yellow-500 to-lime-500';
    if (score >= 6) return 'from-orange-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${getScoreColor(score)} rounded-lg font-bold text-white ${sizeClasses[size]} transition-transform hover:scale-105`}>
      {showIcon && <Star className={`${iconSizes[size]} fill-current`} />}
      <span className="tabular-nums">{score.toFixed(1)}</span>
      {source && <span className="opacity-75 font-normal ml-0.5">{source}</span>}
    </div>
  );
}
