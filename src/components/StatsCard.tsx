import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
  iconColor?: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, className, iconColor = 'text-[#1a56db]' }: StatsCardProps) {
  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trend.isUp ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.isUp ? '↑' : '↓'}</span>
              <span>{trend.value}% 较上月</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl bg-blue-50', iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
