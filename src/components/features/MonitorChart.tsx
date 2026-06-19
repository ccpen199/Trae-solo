import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonitorChartProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function MonitorChart({
  title,
  subtitle,
  children,
  action,
  className,
}: MonitorChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-xl border border-primary-100/50 bg-white p-5 shadow-card',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-primary-800">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-primary-500">{subtitle}</p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="min-h-[240px] w-full">{children}</div>
    </motion.div>
  );
}
