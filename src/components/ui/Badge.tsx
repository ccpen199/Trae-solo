import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: "sm" | "md"
  dot?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-300"
    
    const variants: Record<BadgeVariant, string> = {
      default: "bg-midnight-700 text-midnight-200 border border-midnight-600",
      primary: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
      secondary: "bg-sapphire-500/15 text-sapphire-300 border border-sapphire-500/30",
      success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      danger: "bg-red-500/15 text-red-400 border border-red-500/30",
    }

    const sizes = {
      sm: "text-xs px-2.5 py-0.5",
      md: "text-sm px-3 py-1",
    }

    const dotColors: Record<BadgeVariant, string> = {
      default: "bg-midnight-400",
      primary: "bg-rose-500",
      secondary: "bg-sapphire-400",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-red-500",
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
