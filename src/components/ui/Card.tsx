import React from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = true,
  glow = true,
  gradient = true,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        "transition-all duration-300 ease-out",
        gradient &&
          "bg-gradient-to-br from-deep-sea-500/90 via-deep-sea-600/95 to-deep-sea-700",
        "border border-vital-green-500/20",
        glow && "shadow-lg shadow-vital-green-500/5",
        hoverable &&
          "hover:border-vital-green-500/40 hover:shadow-vital-green-500/15 hover:-translate-y-1",
        className
      )}
    >
      {glow && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(0, 229, 160, 0.08) 0%, transparent 60%)",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Card;
