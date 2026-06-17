import { forwardRef } from "react";
import { cn } from "@/utils";

type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-trust-100 text-trust-700",
  default: "bg-slate-100 text-slate-600",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              variant === "primary" && "bg-primary-500",
              variant === "success" && "bg-emerald-500",
              variant === "warning" && "bg-amber-500",
              variant === "danger" && "bg-rose-500",
              variant === "info" && "bg-trust-500",
              variant === "secondary" && "bg-slate-500",
              variant === "default" && "bg-slate-400"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
