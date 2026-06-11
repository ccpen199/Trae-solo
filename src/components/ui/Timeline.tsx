import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertLevel = "critical" | "warning" | "info" | "success";

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  level: AlertLevel;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const levelConfig: Record<
  AlertLevel,
  { icon: LucideIcon; color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    icon: AlertTriangle,
    color: "text-alert-red-500",
    bg: "bg-alert-red-500/10",
    border: "border-alert-red-500/30",
    dot: "bg-alert-red-500 shadow-alert-red-500/50",
  },
  warning: {
    icon: AlertCircle,
    color: "text-warning-amber-500",
    bg: "bg-warning-amber-500/10",
    border: "border-warning-amber-500/30",
    dot: "bg-warning-amber-500 shadow-warning-amber-500/50",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    dot: "bg-blue-400 shadow-blue-400/50",
  },
  success: {
    icon: CheckCircle,
    color: "text-vital-green-500",
    bg: "bg-vital-green-500/10",
    border: "border-vital-green-500/30",
    dot: "bg-vital-green-500 shadow-vital-green-500/50",
  },
};

const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-5 top-2 bottom-2 w-px bg-vital-green-500/20" />

      <div className="space-y-4">
        {items.map((item, index) => {
          const config = levelConfig[item.level];
          const Icon = config.icon;
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id}
              className={cn(
                "relative pl-14 animate-slide-in",
                "transition-all duration-300",
                "hover:translate-x-1"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  "absolute left-0 top-0 w-10 h-10 rounded-full",
                  "flex items-center justify-center",
                  config.bg,
                  config.border,
                  "border backdrop-blur-sm",
                  "z-10"
                )}
              >
                <Icon className={cn("w-5 h-5", config.color)} />
              </div>

              <div
                className={cn(
                  "absolute left-5 top-10 w-2 h-2 rounded-full",
                  config.dot,
                  "shadow-lg",
                  "z-20",
                  "animate-pulse"
                )}
              />

              {!isLast && (
                <div
                  className={cn(
                    "absolute left-6 top-12 w-0.5",
                    config.dot,
                    "opacity-30",
                    "bottom-0"
                  )}
                  style={{ height: "calc(100% - 40px)" }}
                />
              )}

              <div
                className={cn(
                  "rounded-xl p-4 ml-2",
                  "bg-deep-sea-600/30",
                  "border border-vital-green-500/10",
                  "hover:border-vital-green-500/20",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn("font-semibold text-white", config.color)}>
                    {item.title}
                  </h4>
                  <span className="text-deep-sea-100/50 text-xs font-mono">
                    {item.time}
                  </span>
                </div>
                {item.description && (
                  <p className="text-deep-sea-100/70 text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
