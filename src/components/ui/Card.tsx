import * as React from "react"
import { cn } from "@/lib/utils"

export type CardVariant = "default" | "glass" | "elevated"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hoverable = false, ...props }, ref) => {
    const baseStyles = "rounded-xl overflow-hidden transition-all duration-400 ease-out-expo"
    
    const variants: Record<CardVariant, string> = {
      default: "bg-midnight-800 border border-midnight-700 shadow-card",
      glass: "bg-glass-gradient backdrop-blur-xl border border-white/10 shadow-glass",
      elevated: "bg-midnight-800 border border-midnight-600 shadow-xl shadow-black/30",
    }

    const hoverStyles = hoverable
      ? "hover:shadow-card-hover hover:-translate-y-1 hover:border-rose-500/30 cursor-pointer"
      : ""

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pb-0", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-heading font-semibold text-white leading-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-midnight-300 mt-1.5", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6", className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pt-0 flex items-center", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
