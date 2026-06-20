import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", width, height, ...props }, ref) => {
    const baseStyles = "relative overflow-hidden bg-midnight-700/50"
    
    const shimmerStyles = "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer"

    const variants = {
      text: "h-4 rounded-md",
      circular: "rounded-full",
      rectangular: "rounded-lg",
    }

    const style: React.CSSProperties = {
      ...(width !== undefined && { width: typeof width === "number" ? `${width}px` : width }),
      ...(height !== undefined && { height: typeof height === "number" ? `${height}px` : height }),
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, shimmerStyles, variants[variant], className)}
        style={style}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={cn(
              i === lines - 1 && lines > 1 ? "w-4/5" : "w-full"
            )}
          />
        ))}
      </div>
    )
  }
)
SkeletonText.displayName = "SkeletonText"

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  withImage?: boolean
  lines?: number
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, withImage = true, lines = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-midnight-800 rounded-xl p-6 space-y-4 border border-midnight-700", className)}
        {...props}
      >
        {withImage && <Skeleton variant="rectangular" height={180} className="w-full" />}
        <Skeleton variant="text" className="w-3/4 h-5" />
        <SkeletonText lines={lines} />
      </div>
    )
  }
)
SkeletonCard.displayName = "SkeletonCard"

const SkeletonAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        variant="circular"
        width={40}
        height={40}
        className={className}
        {...props}
      />
    )
  }
)
SkeletonAvatar.displayName = "SkeletonAvatar"

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar }
