import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [count, value]);

  return (
    <motion.span className="font-display text-3xl font-bold tracking-tight">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}

export default function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  trendLabel,
  gradientFrom = "from-forest-800",
  gradientTo = "to-ink-850",
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} border border-gold-600/20 p-5 shadow-card`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-500/5 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-300">{title}</p>
          <div className="mt-2">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </div>
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isPositive ? "bg-jade-500/15 text-jade-400" : "bg-coral-500/15 text-coral-400"
                }`}
              >
                {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-xs text-ink-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 ring-1 ring-gold-500/20">
          <Icon className="h-6 w-6 text-gold-500" />
        </div>
      </div>
    </motion.div>
  );
}
