import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-700',
}

interface TagProps {
  label: string
  color?: string
  onClose?: () => void
}

export default function Tag({ label, color = 'blue', onClose }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
        colorMap[color] || colorMap.blue
      )}
    >
      {label}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
