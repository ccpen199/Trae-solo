import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileText, Image, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/utils/format'
import type { Evidence } from '@/types'

interface UploadedFile {
  id: string
  file: File
  preview?: string
}

interface EvidenceUploadProps {
  maxFiles?: number
  maxSize?: number
  accept?: string
  onFilesChange?: (files: File[]) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function EvidenceUpload({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept = 'image/*,.pdf,.doc,.docx',
  onFilesChange,
}: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles = fileArray.filter((file) => {
        if (file.size > maxSize) {
          return false
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          return false
        }
        return true
      })

      const remainingSlots = maxFiles - files.length
      const filesToAdd = validFiles.slice(0, remainingSlots)

      const uploaded: UploadedFile[] = filesToAdd.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }))

      const updated = [...files, ...uploaded]
      setFiles(updated)
      onFilesChange?.(updated.map((f) => f.file))
    },
    [files, maxFiles, maxSize, onFilesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id)
    setFiles(updated)
    onFilesChange?.(updated.map((f) => f.file))
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />
    }
    return <FileText className="h-6 w-6 text-slate-500" />
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              点击或拖拽文件到此处上传
            </p>
            <p className="mt-1 text-xs text-slate-500">
              支持图片、PDF、Word 文件，单个文件不超过 10MB，最多 {maxFiles} 个
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <p className="text-xs text-amber-700">
          上传的图片将自动添加包含您姓名和手机号的水印，确保证据安全，防止外泄。
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((uploaded) => (
            <div
              key={uploaded.id}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              {uploaded.preview ? (
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={uploaded.preview}
                    alt={uploaded.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-50">
                  <FileIcon type={uploaded.file.type} />
                </div>
              )}
              <button
                onClick={() => removeFile(uploaded.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-slate-700">
                  {uploaded.file.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatFileSize(uploaded.file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
