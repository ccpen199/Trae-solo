import { motion } from "framer-motion";
import { cn, formatPercent } from "@/utils";

type ProgressVariant = "primary" | "success" | "warning" | "danger" | "trust";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  showAnimation?: boolean;
  striped?: boolean;
  animatedStripes?: boolean;
  className?: string;
}

const variantColors: Record<ProgressVariant, string> = {
  primary: "bg-primary-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  trust: "bg-trust-500",
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  showAnimation = true,
  striped = false,
  animatedStripes = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">
            {Math.round(value)} / {max}
          </span>
          <span className="text-sm font-semibold text-slate-600">
            {formatPercent(percentage)}
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-slate-200 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <motion.div
          initial={showAnimation ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            variantColors[variant],
            striped &&
              "bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]",
            animatedStripes && "animate-[shimmer_1.5s_linear_infinite]"
          )}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: animatedStripes
                ? "shimmer 2s linear infinite"
                : undefined,
              backgroundSize: "200% 100%",
            }}
          />
        </motion.div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
