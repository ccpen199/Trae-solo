import { Wand2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import PriceTag from '@/components/common/PriceTag'
import { Template } from '@/types'

interface TemplateCardProps {
  template: Template
  onClick?: () => void
  onStartCreate?: () => void
  className?: string
}

export default function TemplateCard({ template, onClick, onStartCreate, className }: TemplateCardProps) {
  const handleStartCreate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartCreate?.()
  }

  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium',
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3">
          {template.isFree ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-500 px-2.5 py-1 text-xs font-medium text-white">
              免费
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white">
              <PriceTag price={template.price} size="sm" className="text-white" />
            </span>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand-600 shadow-lg transition-transform hover:scale-105"
          >
            <Wand2 className="h-4 w-4" />
            开始制作
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-paper-900 line-clamp-1">
          {template.name}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-paper-500">
            <Users className="h-3.5 w-3.5" />
            <span>{template.usageCount.toLocaleString()} 人使用</span>
          </div>
          <span className="text-xs text-paper-500">
            {template.designerName}
          </span>
        </div>
      </div>
    </div>
  )
}
