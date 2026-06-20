import * as React from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedImage } from '@/types';

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  accept?: string;
  labels?: string[];
  className?: string;
  showScanAnimation?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 9,
  accept = 'image/*',
  labels,
  className,
  showScanAnimation = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxImages - images.length;
    const fileArr = Array.from(files).slice(0, remaining);

    const newImages: UploadedImage[] = fileArr.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    onChange([...images, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    const removed = images.find((i) => i.id === id);
    if (removed && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }
    onChange(images.filter((i) => i.id !== id));
  };

  const currentIndex = images.length;
  const currentLabel = labels?.[currentIndex];
  const canAdd = images.length < maxImages;

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className={cn(
              'relative aspect-square rounded-2xl overflow-hidden group border border-white/10',
              'bg-ink-800/50',
            )}
            onMouseEnter={() => setPreviewId(img.id)}
            onMouseLeave={() => setPreviewId(null)}
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {showScanAnimation && previewId === img.id && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-gold-500/40 to-transparent animate-scan" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink-950/70 backdrop-blur-sm border border-white/10 text-xs font-bold text-gold-400">
                {idx + 1}
              </span>
              {labels?.[idx] && (
                <span className="ml-1.5 inline-block px-2 py-1 rounded-lg bg-ink-950/70 backdrop-blur-sm border border-white/10 text-[11px] font-medium text-ink-200 mt-1">
                  {labels[idx]}
                </span>
              )}
            </div>
            <button
              onClick={() => handleRemove(img.id)}
              className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-ink-950/70 backdrop-blur-sm border border-coral-500/40 text-coral-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-coral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {canAdd && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative aspect-square rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden',
              isDragging
                ? 'border-gold-500 bg-gold-500/10 scale-[1.02]'
                : 'border-ink-600 bg-ink-800/30 hover:border-gold-500/50 hover:bg-ink-800/60',
            )}
          >
            {isDragging && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-gold-500/30 to-transparent animate-scan" />
              </div>
            )}
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300',
                isDragging ? 'bg-gold-500/20 text-gold-400' : 'bg-ink-700/50 text-ink-400',
              )}
            >
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-center px-4">
              <p
                className={cn(
                  'text-sm font-medium transition-colors',
                  isDragging ? 'text-gold-400' : 'text-ink-200',
                )}
              >
                {isDragging ? '松开上传图片' : '拖拽或点击上传'}
              </p>
              <p className="text-xs text-ink-400 mt-1">
                {currentLabel ? `当前: ${currentLabel}` : `还可上传 ${maxImages - images.length} 张`}
              </p>
            </div>
          </div>
        )}
      </div>
      {images.length > 0 && !canAdd && (
        <p className="text-xs text-ink-400 mt-3 text-center">
          已达到最大上传数量 {maxImages} 张
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export { ImageUploader };
