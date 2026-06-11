import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface WaveformDisplayProps {
  data?: number[];
  color?: string;
  height?: number;
  className?: string;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  data,
  color = "#00E5A0",
  height = 40,
  className,
}) => {
  const [waveData, setWaveData] = useState<number[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    if (data) {
      setWaveData(data);
      return;
    }

    const animate = () => {
      timeRef.current += 0.15;
      const points = Array.from({ length: 50 }, (_, i) => {
        const x = (i / 50) * Math.PI * 4 + timeRef.current;
        const baseWave = Math.sin(x) * 0.5;
        const detailWave = Math.sin(x * 3) * 0.2;
        const pulse = Math.sin(timeRef.current * 2) * 0.1;
        return Math.max(0.1, Math.min(1, baseWave + detailWave + pulse + 0.7));
      });
      setWaveData(points);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [data]);

  return (
    <div className={cn("w-full overflow-hidden", className)} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
          <filter id="waveGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={`M 0 40 L 0 ${40 - waveData[0] * 35 || 20} ${waveData
            .map((v, i) => `L ${(i / (waveData.length - 1)) * 200} ${40 - v * 35}`)
            .join(" ")} L 200 40 Z`}
          fill="url(#waveGradient)"
          opacity="0.3"
        />

        <path
          d={`M 0 ${40 - waveData[0] * 35 || 20} ${waveData
            .map((v, i) => `L ${(i / (waveData.length - 1)) * 200} ${40 - v * 35}`)
            .join(" ")}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#waveGlow)"
        />
      </svg>
    </div>
  );
};

export default WaveformDisplay;
