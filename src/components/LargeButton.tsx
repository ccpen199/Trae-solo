import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "normal" | "large" | "xlarge";

interface LargeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  normal: "px-6 py-3",
  large: "px-8 py-4 text-a11y-lg",
  xlarge: "px-10 py-5 text-a11y-xl",
};

export default function LargeButton({
  variant = "primary",
  size = "normal",
  children,
  icon,
  fullWidth,
  disabled,
  className,
  onClick,
  ...rest
}: LargeButtonProps) {
  const variantClass = `a11y-btn-${variant}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "a11y-btn",
        variantClass,
        sizeClasses[size],
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
