import { cn } from '@/lib/utils';

type MatchScoreSize = 'sm' | 'md' | 'lg';

interface MatchScoreBreakdown {
  skillMatch?: number;
  experienceMatch?: number;
  locationMatch?: number;
  salaryMatch?: number;
  scenarioMatch?: number;
}

interface MatchScoreProps {
  score: number;
  size?: MatchScoreSize;
  showDetails?: boolean;
  breakdown?: MatchScoreBreakdown;
  className?: string;
}

const sizeConfig: Record<MatchScoreSize, { container: number; stroke: number; fontSize: number; labelSize: number }> = {
  sm: { container: 80, stroke: 6, fontSize: 18, labelSize: 10 },
  md: { container: 120, stroke: 8, fontSize: 28, labelSize: 12 },
  lg: { container: 180, stroke: 12, fontSize: 42, labelSize: 14 },
};

const breakdownLabels: Record<keyof MatchScoreBreakdown, string> = {
  skillMatch: '技能匹配',
  experienceMatch: '经验匹配',
  locationMatch: '地点匹配',
  salaryMatch: '薪资匹配',
  scenarioMatch: '场景匹配',
};

const MatchScore = ({ score, size = 'md', showDetails = false, breakdown, className }: MatchScoreProps) => {
  const config = sizeConfig[size];
  const radius = (config.container - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number): string => {
    if (s >= 90) return '#4ECDC4';
    if (s >= 75) return '#1E3A5F';
    return '#FF6B6B';
  };

  const getGradientId = `match-score-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const color = getColor(score);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.container, height: config.container }}>
        <svg width={config.container} height={config.container} className="-rotate-90">
          <defs>
            <linearGradient id={getGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke="#E9ECEF"
            strokeWidth={config.stroke}
          />
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke={`url(#${getGradientId})`}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ fontSize: config.fontSize, color }}>
            {score}
          </span>
          <span className="text-neutral-500 font-medium" style={{ fontSize: config.labelSize }}>
            匹配度
          </span>
        </div>
      </div>

      {showDetails && breakdown && (
        <div className="mt-6 w-full space-y-3">
          {Object.entries(breakdown).map(([key, value]) => {
            if (value === undefined) return null;
            const label = breakdownLabels[key as keyof MatchScoreBreakdown];
            const barColor = getColor(value);
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">{label}</span>
                  <span className="font-medium" style={{ color: barColor }}>{value}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { MatchScore };
export type { MatchScoreProps, MatchScoreSize, MatchScoreBreakdown };
