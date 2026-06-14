import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GradientVariant = "blue" | "purple" | "teal" | "amber";

const gradientMap: Record<GradientVariant, string> = {
  blue: "from-brand-500 via-brand-600 to-brand-800",
  purple: "from-indigo-500 via-purple-600 to-purple-800",
  teal: "from-teal-500 via-teal-600 to-cyan-800",
  amber: "from-amber-500 via-orange-600 to-orange-800",
};

interface GradientCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  description?: string;
  variant?: GradientVariant;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GradientCard({
  title,
  value,
  unit,
  icon,
  description,
  variant = "blue",
  footer,
  className,
  onClick,
}: GradientCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 text-white shadow-xl bg-gradient-to-br",
        gradientMap[variant],
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className
      )}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-16 top-8 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-bold tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-white/80 text-sm font-medium">{unit}</span>
            )}
          </div>
          {description && (
            <p className="text-white/70 text-xs mt-1.5">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {footer && (
        <div className="relative pt-4 border-t border-white/15">{footer}</div>
      )}
    </div>
  );
}
