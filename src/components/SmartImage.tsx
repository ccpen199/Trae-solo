import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { ImageOff, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallbackText?: string
  className?: string
  aspectRatio?: string
}

export default function SmartImage({
  src,
  alt,
  fallbackText = '图片加载失败',
  className,
  aspectRatio = 'auto',
  ...props
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const imgSrc = stableImageUrl(src, alt || fallbackText)

  useEffect(() => {
    setStatus('loading')
    setRetryCount(0)
  }, [imgSrc])

  const handleLoad = () => setStatus('loaded')

  const handleError = () => {
    if (retryCount < 1) {
      setTimeout(() => {
        setStatus('loading')
        setRetryCount(prev => prev + 1)
      }, 1000)
    } else {
      setStatus('error')
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    setStatus('loading')
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-slate-100',
        aspectRatio !== 'auto' && `aspect-[${aspectRatio}]`,
        aspectRatio === 'auto' && 'min-h-[200px]',
        className
      )}
      style={{ aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio }}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
          <Loader2 size={24} className="text-slate-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">加载中...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-slate-200">
          <ImageOff size={32} className="text-slate-300 mb-2" strokeWidth={1.5} />
          <p className="text-sm text-slate-500 mb-3">{fallbackText}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg transition-colors"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            重新加载
          </button>
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          status !== 'loaded' && 'opacity-0',
          className
        )}
        style={{ display: status === 'error' ? 'none' : undefined }}
        {...props}
      />
    </div>
  )
}
