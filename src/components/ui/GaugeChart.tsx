import React from "react";
import { cn } from "../../lib/utils";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  size = 200,
  thickness = 16,
  className,
}) => {
  const clampedValue = Math.max(min, Math.min(max, value));
  const percentage = ((clampedValue - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180;
  const radius = (size - thickness) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return "#00E5A0";
    if (pct >= 60) return "#FFBE0B";
    return "#FF4757";
  };

  const color = getColor(percentage);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4757" />
            <stop offset="50%" stopColor="#FFBE0B" />
            <stop offset="100%" stopColor="#00E5A0" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(0, 229, 160, 0.1)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />

        <path
          d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#gaugeGlow)"
          style={{
            transition: "stroke-dashoffset 0.8s ease-out, stroke 0.5s ease",
          }}
        />

        <g transform={`translate(${size / 2}, ${size / 2}) rotate(${angle - 90})`}>
          <line
            x1="0"
            y1="0"
            x2={radius - thickness}
            y2="0"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{ transition: "transform 0.8s ease-out" }}
          />
          <circle cx="0" cy="0" r="8" fill={color} filter="url(#gaugeGlow)" />
        </g>
      </svg>

      <div className="absolute top-6 flex flex-col items-center">
        <span
          className="text-5xl font-din font-bold transition-all duration-500"
          style={{ color, textShadow: `0 0 20px ${color}80` }}
        >
          {Math.round(clampedValue)}
        </span>
        {label && (
          <span className="text-sm text-deep-sea-200/60 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

export default GaugeChart;
