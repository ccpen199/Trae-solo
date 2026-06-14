import { useEffect, useRef } from 'react';
import type { HeatmapPoint } from '@/types';
import { cn } from '@/lib/utils';

interface HeatmapCanvasProps {
  points: HeatmapPoint[];
  width?: number;
  height?: number;
  radius?: number;
  className?: string;
  showLegend?: boolean;
}

export default function HeatmapCanvas({
  points,
  width = 600,
  height = 400,
  radius = 60,
  className,
  showLegend = true,
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const breatheRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      breatheRef.current += 0.02;
      const breatheScale = 1 + Math.sin(breatheRef.current) * 0.1;

      ctx.clearRect(0, 0, width, height);

      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const padding = radius * 1.5;

      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      points.forEach((point) => {
        const px = padding + ((point.x - minX) / rangeX) * (width - padding * 2);
        const py = padding + ((point.y - minY) / rangeY) * (height - padding * 2);
        const weight = point.weight / 100;
        const r = radius * breatheScale * (0.5 + weight * 0.5);

        const gradient = offCtx.createRadialGradient(px, py, 0, px, py, r);

        if (point.type === 'order') {
          gradient.addColorStop(0, `rgba(255, 107, 53, ${0.6 * weight})`);
          gradient.addColorStop(0.3, `rgba(255, 139, 77, ${0.4 * weight})`);
          gradient.addColorStop(0.6, `rgba(255, 172, 122, ${0.2 * weight})`);
          gradient.addColorStop(1, 'rgba(255, 206, 176, 0)');
        } else {
          gradient.addColorStop(0, `rgba(26, 83, 92, ${0.6 * weight})`);
          gradient.addColorStop(0.3, `rgba(62, 140, 151, ${0.4 * weight})`);
          gradient.addColorStop(0.6, `rgba(111, 179, 188, ${0.2 * weight})`);
          gradient.addColorStop(1, 'rgba(172, 212, 217, 0)');
        }

        offCtx.fillStyle = gradient;
        offCtx.beginPath();
        offCtx.arc(px, py, r, 0, Math.PI * 2);
        offCtx.fill();
      });

      ctx.drawImage(offscreen, 0, 0);

      points.forEach((point) => {
        const px = padding + ((point.x - minX) / rangeX) * (width - padding * 2);
        const py = padding + ((point.y - minY) / rangeY) * (height - padding * 2);
        const pulseR = 6 + Math.sin(breatheRef.current * 2) * 2;

        ctx.beginPath();
        ctx.arc(px, py, pulseR + 4, 0, Math.PI * 2);
        ctx.fillStyle = point.type === 'order'
          ? 'rgba(255, 107, 53, 0.2)'
          : 'rgba(26, 83, 92, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = point.type === 'order' ? '#FF6B35' : '#1A535C';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, pulseR - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [points, width, height, radius]);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto rounded-2xl bg-gradient-to-br from-cream-50 to-secondary-50"
      />
      {showLegend && (
        <div className="absolute bottom-4 right-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-card">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-xs text-secondary-600">订单热度</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary-500" />
            <span className="text-xs text-secondary-600">阿姨分布</span>
          </div>
        </div>
      )}
    </div>
  );
}
