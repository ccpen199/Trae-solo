import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Play, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import type { MediaAsset } from '@shared/types';

interface MediaGalleryProps {
  assets: MediaAsset[];
  className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ assets, className }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const photos = assets.filter((a) => a.type === 'photo');
  const threeViews = assets.filter((a) => a.type === 'three_view');
  const videos = assets.filter((a) => a.type === 'video');

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  if (photos.length === 0 && threeViews.length === 0 && videos.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-midnight-800/50 rounded-xl border border-midnight-700', className)}>
        <p className="text-midnight-400">暂无媒体资源</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-midnight-200 mb-3">精选照片</h4>
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden group bg-midnight-800">
            <img
              src={photos[activeIndex]?.url}
              alt={`Photo ${activeIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-midnight-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-midnight-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="sm"
                className="!bg-midnight-900/80 backdrop-blur-md border border-white/10 !text-white hover:!bg-midnight-800"
                onClick={() => openLightbox(activeIndex)}
                leftIcon={<ZoomIn className="w-4 h-4" />}
              >
                放大
              </Button>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === activeIndex
                      ? 'bg-rose-500 w-6'
                      : 'bg-white/40 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-3">
            {photos.slice(0, 5).map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden transition-all duration-300',
                  index === activeIndex
                    ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-midnight-800'
                    : 'hover:ring-2 hover:ring-white/30'
                )}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {threeViews.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-midnight-200 mb-3">三视照</h4>
          <div className="grid grid-cols-3 gap-3">
            {threeViews.map((asset, index) => (
              <div
                key={asset.id}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => openLightbox(photos.length + index)}
              >
                <img
                  src={asset.url}
                  alt={`Three view ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-midnight-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-midnight-200 mb-3">才艺视频</h4>
          <div className="grid grid-cols-2 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer bg-midnight-800"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm text-white font-medium truncate">
                    {video.metadata?.title || '才艺展示视频'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <ModalContent className="!max-w-5xl !p-0 bg-transparent !border-none !shadow-none">
          <div className="relative">
            <img
              src={photos[lightboxIndex]?.url}
              alt={`Photo ${lightboxIndex + 1}`}
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-midnight-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={lightboxPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-midnight-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={lightboxNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-midnight-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-midnight-900/80 backdrop-blur-md">
              <p className="text-sm text-white">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MediaGallery;
