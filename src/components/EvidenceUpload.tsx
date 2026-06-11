import { useRef } from 'react'
import { Plus, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  fileType: 'image' | 'pdf' | 'doc' | 'video' | 'audio'
}

interface EvidenceUploadProps {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number
}

export default function EvidenceUpload({
  files,
  onChange,
  maxFiles = 9,
  maxSize = 10 * 1024 * 1024,
}: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (files.length >= maxFiles) return
    inputRef.current?.click()
  }

  const getFileType = (type: string): 'image' | 'pdf' | 'doc' | 'video' | 'audio' => {
    if (type.startsWith('image/')) return 'image'
    if (type === 'application/pdf') return 'pdf'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    return 'doc'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const remaining = maxFiles - files.length
    const validFiles = selectedFiles
      .slice(0, remaining)
      .filter((f) => f.size <= maxSize)
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f),
        fileType: getFileType(f.type),
      }))
    onChange([...files, ...validFiles])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (id: string) => {
    const target = files.find((f) => f.id === id)
    if (target?.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url)
    }
    onChange(files.filter((f) => f.id !== id))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          >
            {file.fileType === 'image' ? (
              <img
                src={file.url}
                alt={file.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                {file.fileType === 'pdf' ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <FileText className="h-8 w-8 text-blue-500" />
                )}
                <span className="truncate text-xs text-slate-500">{file.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(file.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {formatSize(file.size)}
            </div>
          </div>
        ))}
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500'
            )}
          >
            <Plus className="h-8 w-8" />
            <span className="text-xs">上传证据</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,video/*,audio/*"
        onChange={handleChange}
        className="hidden"
      />
      <p className="mt-2 text-xs text-slate-400">
        支持图片、PDF、Word、Excel、PPT 等格式，单个文件不超过 10MB，最多上传 {maxFiles} 个文件
      </p>
    </div>
  )
}
