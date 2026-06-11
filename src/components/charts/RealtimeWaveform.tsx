import React, { useRef, useEffect, useCallback } from 'react';
import { cn, formatSecondsToTime } from '@/lib/utils';

interface RealtimeWaveformProps {
  breathingWave: number[];
  motionWave: number[];
  breathingRate?: number;
  motionLevel?: number;
  isMonitoring?: boolean;
  elapsedSeconds?: number;
  className?: string;
  height?: number;
}

export default function RealtimeWaveform({
  breathingWave,
  motionWave,
  breathingRate,
  motionLevel,
  isMonitoring = false,
  elapsedSeconds = 0,
  className,
  height = 180,
}: RealtimeWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const scrollOffset = useRef(0);
  const lastTime = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const topHeight = height * 0.55;
      const bottomHeight = height * 0.35;
      const topCenter = topHeight / 2;
      const bottomCenter = topHeight + bottomHeight / 2;
      const dividerY = topHeight + (height - topHeight - bottomHeight) / 2;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(7, 14, 39, 0.3)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(196, 201, 217, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 0; y <= topHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let y = topHeight; y <= height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(196, 201, 217, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, topCenter);
      ctx.lineTo(width, topCenter);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, bottomCenter);
      ctx.lineTo(width, bottomCenter);
      ctx.stroke();
      ctx.setLineDash([]);

      const timeLabels = 5;
      ctx.fillStyle = 'rgba(154, 161, 184, 0.5)';
      ctx.font = '10px monospace';
      for (let i = 0; i <= timeLabels; i++) {
        const x = (width / timeLabels) * i;
        const label = formatSecondsToTime(
          Math.max(0, elapsedSeconds - (timeLabels - i) * 10)
        );
        ctx.fillText(label, x + 4, height - 4);
      }

      const gradTop = ctx.createLinearGradient(0, 0, 0, topHeight);
      gradTop.addColorStop(0, 'rgba(123, 200, 164, 0.3)');
      gradTop.addColorStop(0.5, 'rgba(123, 200, 164, 0.1)');
      gradTop.addColorStop(1, 'rgba(123, 200, 164, 0.02)');

      if (breathingWave.length > 1) {
        const step = width / (breathingWave.length - 1);
        const amplitude = topHeight * 0.4;

        ctx.beginPath();
        ctx.moveTo(0, topCenter);
        for (let i = 0; i < breathingWave.length; i++) {
          const x = i * step;
          const y = topCenter - breathingWave[i] * amplitude;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, topCenter);
        ctx.closePath();
        ctx.fillStyle = gradTop;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < breathingWave.length; i++) {
          const x = i * step;
          const y = topCenter - breathingWave[i] * amplitude;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#7BC8A4';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(123, 200, 164, 0.5)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const lastX = (breathingWave.length - 1) * step;
        const lastY = topCenter - breathingWave[breathingWave.length - 1] * amplitude;
        if (isMonitoring) {
          ctx.beginPath();
          ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#B6E5CF';
          ctx.shadowColor = 'rgba(123, 200, 164, 0.8)';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const gradBottom = ctx.createLinearGradient(0, topHeight, 0, height);
      gradBottom.addColorStop(0, 'rgba(155, 126, 219, 0.25)');
      gradBottom.addColorStop(0.5, 'rgba(155, 126, 219, 0.08)');
      gradBottom.addColorStop(1, 'rgba(155, 126, 219, 0.02)');

      if (motionWave.length > 1) {
        const step = width / (motionWave.length - 1);
        const amplitude = bottomHeight * 0.4;

        ctx.beginPath();
        ctx.moveTo(0, bottomCenter);
        for (let i = 0; i < motionWave.length; i++) {
          const x = i * step;
          const y = bottomCenter - motionWave[i] * amplitude;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, bottomCenter);
        ctx.closePath();
        ctx.fillStyle = gradBottom;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < motionWave.length; i++) {
          const x = i * step;
          const y = bottomCenter - motionWave[i] * amplitude;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#9B7EDB';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(155, 126, 219, 0.4)';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const lastX = (motionWave.length - 1) * step;
        const lastY = bottomCenter - motionWave[motionWave.length - 1] * amplitude;
        if (isMonitoring) {
          ctx.beginPath();
          ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#D1BEF5';
          ctx.shadowColor = 'rgba(155, 126, 219, 0.7)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, dividerY);
      ctx.lineTo(width, dividerY);
      ctx.stroke();
    },
    [breathingWave, motionWave, isMonitoring, elapsedSeconds]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const animate = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const delta = time - lastTime.current;
      lastTime.current = time;

      if (isMonitoring) {
        scrollOffset.current += delta * 0.05;
      }

      draw(ctx, rect.width, height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, height, isMonitoring]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-mint-400 animate-pulse" />
            <span className="text-sm text-white">实时监测</span>
          </div>
          {elapsedSeconds > 0 && (
            <span className="font-mono text-sm text-silver-400">
              {formatSecondsToTime(elapsedSeconds)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          {breathingRate !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-3 rounded-sm bg-mint-400" />
              <span className="text-silver-400">呼吸</span>
              <span className="font-mono text-mint-300">{breathingRate} <span className="text-silver-500">bpm</span></span>
            </div>
          )}
          {motionLevel !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-3 rounded-sm bg-dream-400" />
              <span className="text-silver-400">体动</span>
              <span className="font-mono text-dream-300">
                {Math.round(motionLevel * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-night-900/50">
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ height: `${height}px` }}
        />

        <div className="absolute left-3 top-2 text-[10px] font-medium text-mint-300/80">
          呼吸波形
        </div>
        <div className="absolute left-3 bottom-2 text-[10px] font-medium text-dream-300/80">
          体动波形
        </div>

        {isMonitoring && (
          <div className="absolute right-3 top-2 flex items-center gap-1.5 rounded-full bg-coral-500/20 px-2 py-0.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral-400" />
            <span className="text-[10px] font-medium text-coral-300">REC</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-silver-500">
        <span>时间轴</span>
        <span>← 实时滚动</span>
      </div>
    </div>
  );
}
