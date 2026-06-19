import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 1200;
      const startTime = performance.now();
      const startValue = 0;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (value - startValue) * easeOut;

        if (Number.isInteger(value)) {
          setDisplayValue(Math.round(current));
        } else {
          setDisplayValue(Number(current.toFixed(1)));
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? displayValue : displayValue.toFixed(1)}
      {suffix && <span className="ml-1 text-lg font-medium text-accent-gold">{suffix}</span>}
    </span>
  );
}

export default function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  trend,
  trendLabel,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="glass relative overflow-hidden rounded-xl p-5 shadow-card"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-500/5 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-gradient/10 text-accent-gold-dark">
            <Icon className="h-5 w-5" />
          </div>

          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="opacity-70">{trendLabel}</span>}
            </div>
          )}
        </div>

        <div className="mb-1">
          <p className="text-sm text-primary-500">{label}</p>
        </div>

        <div className="font-serif text-3xl font-bold text-primary-800">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
      </div>
    </motion.div>
  );
}
