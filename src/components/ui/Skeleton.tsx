import { cn } from "@/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  count = 1,
  gap = 8,
  className,
  ...props
}: SkeletonProps) {
  const baseClasses =
    "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse";

  const variantClasses = {
    text: "h-4 rounded w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height
      ? typeof height === "number"
        ? `${height}px`
        : height
      : undefined,
  };

  if (count > 1) {
    return (
      <div
        className="flex flex-col"
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              i === count - 1 && variant === "text" && "w-3/4",
              className
            )}
            style={{
              ...style,
              width:
                i === count - 1 && variant === "text" && !width
                  ? "75%"
                  : style.width,
            }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className,
  showHeader = true,
  showFooter = false,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className={cn("bg-white rounded-xl p-6 space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center gap-4 mb-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      )}
      <Skeleton count={lines} />
      {showFooter && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Skeleton variant="text" width="30%" />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={80} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </div>
        </div>
      )}
    </div>
  );
}
