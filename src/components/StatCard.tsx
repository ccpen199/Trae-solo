import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  color?: "red" | "gold" | "blue" | "green";
}

const colorMap = {
  red: "bg-union-red/10 text-union-red",
  gold: "bg-union-gold/10 text-union-gold",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "red",
}: StatCardProps) {
  return (
    <div className="card flex items-start gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colorMap[color])}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 font-serif">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.direction === "up" ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend.direction === "up" ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.direction === "up" ? "+" : "-"}
              {trend.percentage}%
            </span>
            <span className="text-xs text-gray-400">较上期</span>
          </div>
        )}
      </div>
    </div>
  );
}
