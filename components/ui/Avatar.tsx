"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-3xl",
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
  className?: string;
  status?: "online" | "offline" | "busy" | "away";
}

function Avatar({
  src,
  alt = "avatar",
  size = "md",
  fallback,
  className,
  status,
}: AvatarProps) {
  const [error, setError] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fallbackText = fallback ? getInitials(fallback) : "";

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-200 font-medium text-slate-600",
          sizeClasses[size]
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : fallback ? (
          <span className="font-semibold">{fallbackText}</span>
        ) : (
          <User className={cn("opacity-50", size === "xs" || size === "sm" ? "h-4 w-4" : "h-1/2 w-1/2")} />
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            size === "xs" ? "h-1.5 w-1.5" : size === "sm" ? "h-2 w-2" : size === "md" ? "h-2.5 w-2.5" : size === "lg" ? "h-3 w-3" : "h-3.5 w-3.5",
            status === "online" && "bg-emerald-500",
            status === "offline" && "bg-slate-400",
            status === "busy" && "bg-red-500",
            status === "away" && "bg-amber-500"
          )}
        />
      )}
    </div>
  );
}

export { Avatar };
