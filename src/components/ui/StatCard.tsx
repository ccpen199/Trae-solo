import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  title: string;
  trend?: string;
  trendColor?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export default function StatCard({ icon, value, title, trend, trendColor = 'neutral', delay = 0 }: StatCardProps) {
  const trendColorClasses = {
    up: 'text-insurance',
    down: 'text-risk',
    neutral: 'text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="glass-card glass-card-hover relative overflow-hidden p-5 group"
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-gradient-to-br from-gold-400/15 to-transparent blur-2xl group-hover:from-gold-400/25 transition-all duration-500" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-2">{title}</p>
          <div className="text-3xl font-bold gold-gradient-text tracking-tight">{value}</div>
          {trend && (
            <p className={cn('mt-2 text-sm font-medium', trendColorClasses[trendColor])}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 text-gold-300 border border-gold-400/20">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
