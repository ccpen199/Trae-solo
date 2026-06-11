import React from "react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  status?: "normal" | "warning" | "critical";
  children?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  status = "normal",
  children,
  className,
}) => {
  const statusStyles = {
    normal: "text-vital-green-400",
    warning: "text-warning-amber-500",
    critical: "text-alert-red-500",
  };

  const statusGlow = {
    normal: "shadow-vital-green-500/20",
    warning: "shadow-warning-amber-500/20",
    critical: "shadow-alert-red-500/20",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 overflow-hidden",
        "bg-gradient-to-br from-deep-sea-500/90 via-deep-sea-600/95 to-deep-sea-700",
        "border border-vital-green-500/20",
        "shadow-lg transition-all duration-300 ease-out",
        "hover:border-vital-green-500/40 hover:-translate-y-1",
        statusGlow[status],
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(0, 229, 160, 0.08) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-deep-sea-200/70">{title}</span>
          {icon && <div className={statusStyles[status]}>{icon}</div>}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className={cn(
              "text-4xl font-din font-bold tracking-tight transition-all duration-500",
              statusStyles[status]
            )}
            style={{ textShadow: status === "normal" ? "0 0 20px rgba(0, 229, 160, 0.5)" : undefined }}
          >
            {value}
          </span>
          {unit && <span className="text-sm text-deep-sea-200/50">{unit}</span>}
        </div>
        {trend && (
          <div
            className={cn(
              "text-xs flex items-center gap-1",
              trend.isUp ? "text-vital-green-400" : "text-alert-red-400"
            )}
          >
            <span>{trend.isUp ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default StatCard;
