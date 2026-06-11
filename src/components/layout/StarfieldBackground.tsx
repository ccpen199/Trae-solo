import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftSpeedX: number;
  driftSpeedY: number;
  depth: number;
}

interface StarfieldBackgroundProps {
  starCount?: number;
  className?: string;
}

export function StarfieldBackground({
  starCount = 120,
  className,
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          baseOpacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.003 + 0.001,
          twinklePhase: Math.random() * Math.PI * 2,
          driftSpeedX: (Math.random() - 0.5) * 0.15,
          driftSpeedY: (Math.random() - 0.5) * 0.1,
          depth: Math.random() * 0.5 + 0.5,
        });
      }
      starsRef.current = stars;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now();
      const parallaxStrength = 25;

      starsRef.current.forEach((star) => {
        star.x += star.driftSpeedX * star.depth;
        star.y += star.driftSpeedY * star.depth;

        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.4 + 0.6;
        const opacity = star.baseOpacity * twinkle;

        const parallaxX = mouseRef.current.x * parallaxStrength * star.depth;
        const parallaxY = mouseRef.current.y * parallaxStrength * star.depth;

        const drawX = star.x + parallaxX;
        const drawY = star.y + parallaxY;

        const gradient = ctx.createRadialGradient(
          drawX,
          drawY,
          0,
          drawX,
          drawY,
          star.size * 3
        );
        gradient.addColorStop(0, `rgba(200, 210, 255, ${opacity})`);
        gradient.addColorStop(0.3, `rgba(155, 126, 219, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(155, 126, 219, 0)');

        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 255, ${Math.min(opacity + 0.3, 1)})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'fixed inset-0 z-0 pointer-events-none',
        'w-full h-full',
        className
      )}
      style={{ background: 'transparent' }}
    />
  );
}
