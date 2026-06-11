import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HeatMapMode = 'capacity' | 'orders';

export interface HeatMapDataPoint {
  x: number;
  y: number;
  value: number;
  label: string;
  id: string;
}

export interface HeatMapCanvasProps {
  mode: HeatMapMode;
  data: HeatMapDataPoint[];
  width?: number;
  height?: number;
  className?: string;
  showTimeline?: boolean;
  timelineStart?: Date;
  timelineEnd?: Date;
  onTimelineChange?: (time: Date) => void;
}

interface HoverInfo {
  point: HeatMapDataPoint;
  x: number;
  y: number;
}

export const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({
  mode,
  data,
  width = 800,
  height = 600,
  className,
  showTimeline = true,
  timelineStart = new Date(Date.now() - 24 * 60 * 60 * 1000),
  timelineEnd = new Date(),
  onTimelineChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(timelineEnd);
  const animationRef = useRef<number | null>(null);

  const getColorByValue = useCallback((value: number, maxValue: number): [number, number, number, number] => {
    const ratio = Math.min(value / maxValue, 1);
    
    if (mode === 'capacity') {
      if (ratio < 0.3) return [59, 130, 246, 0.15];
      if (ratio < 0.5) return [16, 185, 129, 0.35];
      if (ratio < 0.7) return [245, 158, 11, 0.55];
      return [239, 68, 68, 0.75];
    } else {
      if (ratio < 0.3) return [99, 102, 241, 0.15];
      if (ratio < 0.5) return [59, 130, 246, 0.4];
      if (ratio < 0.7) return [245, 158, 11, 0.6];
      return [239, 68, 68, 0.85];
    }
  }, [mode]);

  const drawHeatMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0B1220');
    gradient.addColorStop(0.5, '#0F172A');
    gradient.addColorStop(1, '#070B14');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.3);
    ctx.quadraticCurveTo(width * 0.3, height * 0.1, width * 0.5, height * 0.25);
    ctx.quadraticCurveTo(width * 0.7, height * 0.4, width * 0.9, height * 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.6);
    ctx.quadraticCurveTo(width * 0.4, height * 0.75, width * 0.6, height * 0.65);
    ctx.quadraticCurveTo(width * 0.8, height * 0.55, width * 0.95, height * 0.7);
    ctx.stroke();

    const maxValue = Math.max(...data.map(d => d.value), 1);

    data.forEach((point) => {
      const [r, g, b, a] = getColorByValue(point.value, maxValue);
      const radius = 25 + (point.value / maxValue) * 45;

      const radialGradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      radialGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
      radialGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);
      radialGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      const coreRadius = 3 + (point.value / maxValue) * 4;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + (point.value / maxValue) * 0.4})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, width, height, getColorByValue]);

  useEffect(() => {
    drawHeatMap();
  }, [drawHeatMap]);

  useEffect(() => {
    const handleResize = () => {
      drawHeatMap();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawHeatMap]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closestPoint: HeatMapDataPoint | null = null;
    let closestDistance = 35;

    data.forEach((point) => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      setHoverInfo({ point: closestPoint, x, y });
    } else {
      setHoverInfo(null);
    }
  }, [data]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();

    const animate = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      setCurrentTime((prev) => {
        const newTime = new Date(prev.getTime() + delta * 60000);
        if (newTime >= timelineEnd) {
          setIsPlaying(false);
          return timelineEnd;
        }
        onTimelineChange?.(newTime);
        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timelineStart, timelineEnd, onTimelineChange]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = new Date(
      timelineStart.getTime() + ratio * (timelineEnd.getTime() - timelineStart.getTime())
    );
    setCurrentTime(newTime);
    onTimelineChange?.(newTime);
  };

  const progressRatio =
    (currentTime.getTime() - timelineStart.getTime()) /
    (timelineEnd.getTime() - timelineStart.getTime());

  return (
    <div ref={containerRef} className={cn('relative bg-space-blue-800 rounded-xl overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block cursor-crosshair"
      />

      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-10 bg-space-blue-700/95 border border-space-blue-500 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.min(hoverInfo.x + 12, width - 180),
            top: Math.min(hoverInfo.y + 12, height - 100),
          }}
        >
          <div className="text-sm font-medium text-amber-accent-400 mb-1">{hoverInfo.point.label}</div>
          <div className="text-xs text-gray-400">
            {mode === 'capacity' ? '运力指数' : '订单密度'}:
            <span className="text-gray-200 font-mono-code ml-1">{hoverInfo.point.value}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">ID: {hoverInfo.point.id}</div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-2 bg-space-blue-700/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-space-blue-500">
        <Clock className="w-4 h-4 text-amber-accent-400" />
        <span className="text-sm text-gray-200 font-mono-code">{formatTime(currentTime)}</span>
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className={cn(
          'w-3 h-3 rounded-full',
          mode === 'capacity' ? 'bg-success-500' : 'bg-info-500'
        )} />
        <span className="text-sm text-gray-300">
          {mode === 'capacity' ? '运力热力图' : '订单热力图'}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 bg-space-blue-700/80 backdrop-blur-sm rounded-lg p-3 border border-space-blue-500">
        <div className="text-xs text-gray-400 mb-2">
          {mode === 'capacity' ? '运力密度' : '订单密度'}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded-sm" style={{ background: 'rgba(59, 130, 246, 0.4)' }} />
          <div className="w-6 h-3 rounded-sm" style={{ background: 'rgba(16, 185, 129, 0.5)' }} />
          <div className="w-6 h-3 rounded-sm" style={{ background: 'rgba(245, 158, 11, 0.7)' }} />
          <div className="w-6 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.85)' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>低</span>
          <span>高</span>
        </div>
      </div>

      {showTimeline && (
        <div className="absolute bottom-4 left-4 right-32 bg-space-blue-700/80 backdrop-blur-sm rounded-lg p-3 border border-space-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                setCurrentTime(timelineStart);
                onTimelineChange?.(timelineStart);
              }}
              className="p-1 hover:bg-space-blue-600 rounded transition-colors text-gray-400 hover:text-gray-200"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-amber-accent-500 hover:bg-amber-accent-400 rounded transition-colors text-space-blue-900"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setCurrentTime(timelineEnd);
                onTimelineChange?.(timelineEnd);
              }}
              className="p-1 hover:bg-space-blue-600 rounded transition-colors text-gray-400 hover:text-gray-200"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <div className="flex-1 text-xs text-gray-400 font-mono-code flex justify-between">
              <span>{formatTime(timelineStart)}</span>
              <span>{formatTime(timelineEnd)}</span>
            </div>
          </div>
          <div
            className="h-2 bg-space-blue-600 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleTimelineClick}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-accent-600 to-amber-accent-400 rounded-full transition-all"
              style={{ width: `${progressRatio * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-accent-400 rounded-full shadow-glow-amber cursor-grab"
              style={{ left: `calc(${progressRatio * 100}% - 8px)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatMapCanvas;
