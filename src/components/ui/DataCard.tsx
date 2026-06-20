import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type GradientVariant = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface DataCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  gradient?: GradientVariant;
  className?: string;
}

const gradientClasses: Record<GradientVariant, string> = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-green-500 to-emerald-600',
  purple: 'bg-gradient-to-br from-purple-500 to-violet-600',
  orange: 'bg-gradient-to-br from-orange-500 to-amber-600',
  red: 'bg-gradient-to-br from-red-500 to-rose-600',
};

export const DataCard = ({
  icon: Icon,
  value,
  label,
  trend,
  gradient = 'blue',
  className,
}: DataCardProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6 text-white shadow-lg',
        gradientClasses[gradient],
        className
      )}
    >
      <div className="absolute right-4 top-4 opacity-20">
        <Icon className="w-20 h-20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold">{value}</p>
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-sm">{label}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend.isUp ? 'text-green-200' : 'text-red-200'
                )}
              >
                {trend.isUp ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCard;
