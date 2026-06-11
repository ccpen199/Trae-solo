import React from "react";
import { cn } from "../../lib/utils";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 80,
  thickness = 6,
  color = "#00E5A0",
  label,
  showValue = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0, 229, 160, 0.1)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#ringGlow)"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span
            className="text-lg font-din font-bold"
            style={{ color, textShadow: `0 0 10px ${color}60` }}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      {label && (
        <span className="text-xs text-deep-sea-200/60 mt-1">{label}</span>
      )}
    </div>
  );
};

export default ProgressRing;
