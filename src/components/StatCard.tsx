import AnimatedNumber from "./AnimatedNumber";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color: "primary" | "emerald" | "gold" | "red";
}

const colorMap = {
  primary: { bg: "bg-primary-50", icon: "bg-primary-900 text-primary-100", border: "border-primary-100" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-700 text-emerald-100", border: "border-emerald-100" },
  gold: { bg: "bg-gold-50", icon: "bg-gold-700 text-gold-100", border: "border-gold-100" },
  red: { bg: "bg-red-50", icon: "bg-red-600 text-red-100", border: "border-red-100" },
};

export default function StatCard({ title, value, suffix = "", prefix = "", decimals = 0, trend, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 hover-lift`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} className="text-2xl font-bold text-gray-900" />
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className={`text-xs font-medium ${trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-red-600" : "text-gray-500"}`}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
