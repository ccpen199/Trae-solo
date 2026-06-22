import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, FileWarning, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadingFile {
  id: string
  file: File
  preview: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface PhotoUploaderProps {
  maxFiles?: number
  maxSize?: number
  accept?: string[]
  onUploadComplete?: (files: File[]) => void
  className?: string
}

export default function PhotoUploader({
  maxFiles = 20,
  maxSize = 10 * 1024 * 1024,
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  onUploadComplete,
  className,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return `不支持的格式: ${file.type}`
    }
    if (file.size > maxSize) {
      return `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB`
    }
    return null
  }

  const simulateUpload = useCallback((fileItem: UploadingFile) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, progress: 100, status: 'success' } : f
          )
        )
      } else {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, progress } : f
          )
        )
      }
    }, 200)
  }, [])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxFiles - uploadingFiles.length
    const filesToProcess = fileArray.slice(0, remainingSlots)

    const newFiles: UploadingFile[] = filesToProcess.map(file => {
      const error = validateFile(file)
      return {
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: error ? 'error' : 'uploading',
        error,
      }
    })

    setUploadingFiles(prev => [...prev, ...newFiles])

    newFiles.forEach(f => {
      if (f.status === 'uploading') {
        simulateUpload(f)
      }
    })

    const validFiles = newFiles.filter(f => f.status !== 'error').map(f => f.file)
    if (validFiles.length > 0) {
      onUploadComplete?.(validFiles)
    }
  }, [maxFiles, uploadingFiles.length, simulateUpload, onUploadComplete])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const formatList = accept.map(type => {
    const ext = type.split('/')[1]?.toUpperCase()
    return ext || type
  }).join('、')

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-paper-50 px-6 py-10 transition-all duration-200',
          isDragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-paper-300 hover:border-brand-300 hover:bg-paper-100'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          className="hidden"
          onChange={handleInputChange}
        />

        <div className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors',
          isDragging ? 'bg-brand-100' : 'bg-paper-200'
        )}>
          <Upload className={cn('h-8 w-8', isDragging ? 'text-brand-500' : 'text-paper-500')} />
        </div>

        <p className="font-display text-lg font-semibold text-paper-900">
          {isDragging ? '松开鼠标上传照片' : '拖拽照片到此处上传'}
        </p>
        <p className="mt-1 text-sm text-paper-500">
          或 <span className="text-brand-500 hover:underline">点击选择文件</span>
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-paper-500">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            支持 {formatList}
          </span>
          <span className="flex items-center gap-1">
            <FileWarning className="h-3.5 w-3.5" />
            单张最大 {(maxSize / 1024 / 1024).toFixed(0)}MB
          </span>
        </div>

        <div className="mt-2 text-xs text-paper-500">
          已上传 {uploadingFiles.filter(f => f.status === 'success').length} / {maxFiles} 张
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {uploadingFiles.map(file => (
            <div
              key={file.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-paper-100"
            >
              <img
                src={file.preview}
                alt={file.file.name}
                className="h-full w-full object-cover"
              />

              {file.status === 'uploading' && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-200"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-[10px] text-white">
                    {Math.round(file.progress)}%
                  </p>
                </div>
              )}

              {file.status === 'success' && (
                <div className="absolute right-2 top-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                </div>
              )}

              {file.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 p-2 text-center">
                  <FileWarning className="mb-1 h-5 w-5 text-white" />
                  <p className="text-[10px] font-medium text-white">{file.error}</p>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-[10px] text-white">{file.file.name}</p>
                <p className="text-[10px] text-white/70">{formatFileSize(file.file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
