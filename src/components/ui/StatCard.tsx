import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'gold' | 'success' | 'danger' | 'info';
  delay?: number;
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600',
  gold: 'bg-gold-50 text-gold-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card p-6 group hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <motion.h3
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="text-3xl font-bold text-gray-900 font-display"
          >
            {value}
          </motion.h3>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend.isPositive ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">较上月</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            colorClasses[color]
          )}
        >
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </motion.div>
  );
}
