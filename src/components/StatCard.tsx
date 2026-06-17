import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  accentColor?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  accentColor = "#00f0ff",
  subtitle,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className="stat-card group hover:scale-[1.02] transition-transform duration-300"
      style={{ ["--accent-color" as string]: accentColor }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-display font-bold text-white animate-count-up">
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive && "text-success-500",
              isNegative && "text-danger-500",
              !isPositive && !isNegative && "text-gray-500"
            )}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
