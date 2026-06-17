import { cn } from "@/utils";

type StatusType =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "inactive"
  | "processing";

interface StatusDotProps {
  status: StatusType;
  label?: string | false;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { dotColor: string; bgColor: string; textColor: string; label: string }
> = {
  success: {
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    label: "正常",
  },
  warning: {
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    label: "警告",
  },
  danger: {
    dotColor: "bg-rose-500",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    label: "危险",
  },
  info: {
    dotColor: "bg-trust-500",
    bgColor: "bg-trust-50",
    textColor: "text-trust-700",
    label: "信息",
  },
  pending: {
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    label: "待处理",
  },
  inactive: {
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-50",
    textColor: "text-slate-600",
    label: "未激活",
  },
  processing: {
    dotColor: "bg-primary-500",
    bgColor: "bg-primary-50",
    textColor: "text-primary-700",
    label: "处理中",
  },
};

const sizeClasses = {
  sm: { dot: "w-2 h-2", text: "text-xs", padding: "px-2 py-0.5" },
  md: { dot: "w-2.5 h-2.5", text: "text-sm", padding: "px-2.5 py-1" },
  lg: { dot: "w-3 h-3", text: "text-sm", padding: "px-3 py-1.5" },
};

export function StatusDot({
  status,
  label,
  size = "md",
  pulse = false,
  className,
}: StatusDotProps) {
  const config = statusConfig[status];
  const sizeConfig = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        sizeConfig.padding,
        sizeConfig.text,
        className
      )}
    >
      <span
        className={cn(
          "relative rounded-full",
          config.dotColor,
          sizeConfig.dot,
          pulse && "animate-pulse"
        )}
      >
        {pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              config.dotColor
            )}
          />
        )}
      </span>
      {label !== false && <span>{label || config.label}</span>}
    </div>
  );
}
