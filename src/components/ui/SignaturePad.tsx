import * as React from 'react';
import { Eraser, Download } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  value?: string;
  onChange?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
  penColor?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  width = 560,
  height = 220,
  className,
  penColor = '#C9A962',
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const lastPoint = React.useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = React.useState(false);

  React.useEffect(() => {
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

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;
    ctx.shadowColor = penColor;
    ctx.shadowBlur = 4;

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [width, height, penColor, value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPoint.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPoint.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const endDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPoint.current = null;
      setHasSignature(true);
      emitChange();
    }
  };

  const emitChange = () => {
    if (!onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    setHasSignature(false);
    onChange?.('');
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={cn('space-y-4 w-full', className)}>
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border transition-colors duration-300',
          hasSignature
            ? 'border-gold-500/40 bg-ink-850/60'
            : 'border-ink-700 bg-ink-800/40',
        )}
        style={{ width: '100%', maxWidth: width }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(201,169,98,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(201,169,98,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-ink-400 text-sm font-medium">在此区域签名</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="relative touch-none cursor-crosshair"
        />
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-ink-950/40 to-transparent pointer-events-none flex items-end px-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <div className="w-2 h-2 rounded-full" style={{ background: penColor }} />
            <span>金色笔触</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={!hasSignature}>
          <Eraser className="w-4 h-4" />
          清空
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!hasSignature}>
          <Download className="w-4 h-4" />
          导出
        </Button>
      </div>
    </div>
  );
};

export { SignaturePad };
