import { useState } from 'react'
import { Check, Lock, Users, Globe, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Photo, PrivacyType } from '@/types'

interface PhotoGridProps {
  photos: Photo[]
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onPhotoClick?: (photo: Photo) => void
  className?: string
}

const privacyConfig: Record<PrivacyType, { icon: typeof Lock | typeof Users | typeof Globe; label: string; color: string }> = {
  public: { icon: Globe, label: '公开', color: 'text-green-500' },
  private: { icon: Lock, label: '私密', color: 'text-paper-400' },
  friends: { icon: Users, label: '好友可见', color: 'text-blue-500' },
}

export default function PhotoGrid({
  photos,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onPhotoClick,
  className,
}: PhotoGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const toggleSelect = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSelectionChange) return

    const newSelected = selectedIds.includes(photoId)
      ? selectedIds.filter(id => id !== photoId)
      : [...selectedIds, photoId]

    onSelectionChange(newSelected)
  }

  const handlePhotoClick = (photo: Photo) => {
    onPhotoClick?.(photo)
  }

  return (
    <div className={cn(
      'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
      className
    )}>
      {photos.map(photo => {
        const isSelected = selectedIds.includes(photo.id)
        const isHovered = hoveredId === photo.id
        const privacy = privacyConfig[photo.privacy]
        const PrivacyIcon = privacy.icon

        return (
          <div
            key={photo.id}
            className={cn(
              'group relative cursor-pointer overflow-hidden rounded-lg bg-paper-100 transition-all duration-200',
              isSelected && 'ring-2 ring-brand-500 ring-offset-2',
              !isSelected && 'hover:-translate-y-0.5 hover:shadow-medium'
            )}
            onMouseEnter={() => setHoveredId(photo.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handlePhotoClick(photo)}
          >
            <div className="relative aspect-square">
              <img
                src={photo.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {selectable && (
                <button
                  onClick={(e) => toggleSelect(photo.id, e)}
                  className={cn(
                    'absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-white/70 bg-white/30 text-transparent',
                    isHovered && !isSelected && 'border-white bg-white/50'
                  )}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              )}

              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                <PrivacyIcon className={cn('h-3 w-3', privacy.color)} />
                <span>{privacy.label}</span>
              </div>

              {photo.aiEnhanced && (
                <div className="absolute bottom-3 right-3 rounded-md bg-brand-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  AI 增强
                </div>
              )}

              <div className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200',
                isHovered && 'opacity-100'
              )}>
                <p className="truncate text-xs font-medium text-white">
                  {photo.width} × {photo.height}
                </p>
                <p className="text-[10px] text-white/70">
                  {(photo.size / 1024 / 1024).toFixed(1)} MB · {photo.format.toUpperCase()}
                </p>
              </div>
            </div>

            {selectable && isSelected && (
              <div className="absolute inset-0 bg-brand-500/10 pointer-events-none" />
            )}
          </div>
        )
      })}
    </div>
  )
}
