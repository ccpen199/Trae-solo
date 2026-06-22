import { useState, useRef, useCallback, useEffect } from 'react'
import { MoveHorizontal, Image as ImageIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Photo } from '@/types'

interface CompareViewerProps {
  photo: Photo
  className?: string
}

type CompareMode = 'split' | 'hover' | 'toggle'

export default function CompareViewer({ photo, className }: CompareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<CompareMode>('split')
  const [showOriginal, setShowOriginal] = useState(false)
  const [hoverPosition, setHoverPosition] = useState(50)

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const position = ((clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, position)))
  }, [])

  const updateHoverPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const position = ((clientX - rect.left) / rect.width) * 100
    setHoverPosition(Math.max(0, Math.min(100, position)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'split') return
    e.preventDefault()
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }, [mode, updateSliderPosition])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      updateSliderPosition(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, updateSliderPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === 'hover') {
      updateHoverPosition(e.clientX)
    }
  }, [mode, updateHoverPosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (mode === 'split' && isDragging) {
      updateSliderPosition(e.touches[0].clientX)
    }
  }, [mode, isDragging, updateSliderPosition])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mode !== 'split') return
    setIsDragging(true)
    updateSliderPosition(e.touches[0].clientX)
  }, [mode, updateSliderPosition])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const displayPosition = mode === 'hover' ? hoverPosition : sliderPosition

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('split')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              mode === 'split'
                ? 'bg-brand-500 text-white'
                : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
            )}
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
            分屏对比
          </button>
          <button
            onClick={() => setMode('hover')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              mode === 'hover'
                ? 'bg-brand-500 text-white'
                : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            悬停对比
          </button>
          <button
            onClick={() => {
              setMode('toggle')
              setShowOriginal(false)
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              mode === 'toggle'
                ? 'bg-brand-500 text-white'
                : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            切换对比
          </button>
        </div>

        {mode === 'toggle' && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="rounded-lg bg-paper-100 px-3 py-1.5 text-xs font-medium text-paper-600 transition-colors hover:bg-paper-200"
          >
            {showOriginal ? '显示效果图' : '显示原图'}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={cn(
          'film-border relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-900',
          mode === 'split' && 'cursor-ew-resize',
          isDragging && 'select-none'
        )}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-3">
          <img
            src={photo.url}
            alt="效果图"
            className="h-full w-full object-contain"
          />
        </div>

        {mode !== 'toggle' && (
          <div
            className="absolute left-3 top-3 bottom-3 overflow-hidden"
            style={{ width: `calc(${displayPosition}% - 6px)` }}
          >
            <img
              src={photo.originalUrl}
              alt="原图"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {mode === 'toggle' && showOriginal && (
          <div className="absolute inset-3">
            <img
              src={photo.originalUrl}
              alt="原图"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {mode !== 'toggle' && (
          <div
            ref={sliderRef}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            style={{ left: `calc(${displayPosition}% + 3px)` }}
          >
            <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
              <MoveHorizontal className="h-5 w-5 text-paper-600" />
            </div>
          </div>
        )}

        <div className="absolute bottom-5 left-5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
          原图
        </div>
        <div className="absolute bottom-5 right-5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
          效果图
        </div>
      </div>
    </div>
  )
}
