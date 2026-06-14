import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { cn } from '@/utils/common';

interface CompareImageProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function CompareImage({
  beforeImage,
  afterImage,
  beforeLabel = '服务前',
  afterLabel = '服务后',
  className,
}: CompareImageProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  return (
    <div
      ref={containerRef}
      className={cn('relative rounded-2xl overflow-hidden cursor-col-resize select-none', className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
      onMouseLeave={handleMouseUp}
    >
      <img src={afterImage} alt={afterLabel} className="w-full aspect-square object-cover" />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt={beforeLabel} className="w-full aspect-square object-cover" />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <Move className="w-5 h-5 text-neutral-600" />
        </div>
      </div>

      <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-full backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 px-3 py-1.5 bg-primary-500/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
        {afterLabel}
      </div>
    </div>
  );
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  className?: string;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 4,
  label,
  className,
}: ImageUploaderProps) {
  const handleUpload = () => {
    const newImages = [
      ...images,
      `/local-placeholder.svg`,
    ].slice(0, maxImages);
    onChange(newImages);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-neutral-700 mb-2">{label}</p>}
      <div className="flex flex-wrap gap-3">
        {images.map((img, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
            <img
              src={img}
              alt={`上传图片 ${index + 1}`}
              className="w-24 h-24 object-cover rounded-xl border-2 border-neutral-200"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </motion.div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleUpload}
            className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-neutral-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs">上传</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageViewer({ src, alt, className }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={cn('relative rounded-xl overflow-hidden cursor-zoom-in group', className)}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-12 right-0 text-white hover:text-neutral-300"
              onClick={() => setIsOpen(false)}
            >
              关闭
            </button>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(0.5, zoom - 0.25));
                }}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(3, zoom + 0.25));
                }}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
