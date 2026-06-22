import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Image as ImageIcon,
  Type,
  Square,
  Sticker,
  PaintBucket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorLayer, LayerType } from '@/types'

interface LayerPanelProps {
  layers: EditorLayer[]
  selectedLayerId?: string
  onSelectLayer?: (layerId: string) => void
  onToggleVisibility?: (layerId: string) => void
  onToggleLock?: (layerId: string) => void
  onReorder?: (layers: EditorLayer[]) => void
  onAddLayer?: () => void
  onDeleteLayer?: (layerId: string) => void
  onDuplicateLayer?: (layerId: string) => void
  className?: string
}

const layerTypeIcons: Record<LayerType, typeof ImageIcon> = {
  image: ImageIcon,
  text: Type,
  shape: Square,
  mask: PaintBucket,
  sticker: Sticker,
  background: ImageIcon,
}

const layerTypeLabels: Record<LayerType, string> = {
  image: '图片',
  text: '文字',
  shape: '形状',
  mask: '蒙版',
  sticker: '贴纸',
  background: '背景',
}

export default function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onReorder,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  className,
}: LayerPanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedId(layerId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (layerId !== draggedId) {
      setDragOverId(layerId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId || !onReorder) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const newLayers = [...layers]
    const draggedIndex = newLayers.findIndex(l => l.id === draggedId)
    const targetIndex = newLayers.findIndex(l => l.id === targetId)

    const [draggedLayer] = newLayers.splice(draggedIndex, 1)
    newLayers.splice(targetIndex, 0, draggedLayer)

    newLayers.forEach((layer, index) => {
      layer.order = index
    })

    onReorder(newLayers)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order)

  return (
    <div className={cn('flex h-full flex-col rounded-lg bg-white shadow-soft', className)}>
      <div className="flex items-center justify-between border-b border-paper-200 px-4 py-3">
        <h3 className="font-display text-base font-semibold text-paper-900">
          图层
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddLayer}
            className="flex h-8 w-8 items-center justify-center rounded-md text-paper-500 transition-colors hover:bg-paper-100 hover:text-brand-500"
            title="新建图层"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => selectedLayerId && onDuplicateLayer?.(selectedLayerId)}
            disabled={!selectedLayerId}
            className="flex h-8 w-8 items-center justify-center rounded-md text-paper-500 transition-colors hover:bg-paper-100 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="复制图层"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => selectedLayerId && onDeleteLayer?.(selectedLayerId)}
            disabled={!selectedLayerId}
            className="flex h-8 w-8 items-center justify-center rounded-md text-paper-500 transition-colors hover:bg-paper-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="删除图层"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sortedLayers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-paper-400">
            <ImageIcon className="mb-2 h-10 w-10" />
            <p className="text-sm">暂无图层</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedLayers.map(layer => {
              const TypeIcon = layerTypeIcons[layer.type]
              const isSelected = layer.id === selectedLayerId
              const isDragOver = dragOverId === layer.id
              const isDragging = draggedId === layer.id

              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, layer.id)}
                  onDragOver={(e) => handleDragOver(e, layer.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, layer.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectLayer?.(layer.id)}
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-all',
                    isSelected
                      ? 'bg-brand-50 text-brand-700'
                      : 'hover:bg-paper-100 text-paper-700',
                    isDragOver && 'border-t-2 border-brand-500',
                    isDragging && 'opacity-50'
                  )}
                >
                  <div className="cursor-grab text-paper-400 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-paper-100">
                    {layer.imageData?.src ? (
                      <img
                        src={layer.imageData.src}
                        alt={layer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-paper-400" />
                      </div>
                    )}
                    {!layer.visible && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <EyeOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{layer.name}</p>
                    <p className="text-[10px] text-paper-400">
                      {layerTypeLabels[layer.type]}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleVisibility?.(layer.id)
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded transition-colors',
                        layer.visible
                          ? 'text-paper-400 hover:text-paper-600'
                          : 'text-paper-300 hover:text-paper-500'
                      )}
                      title={layer.visible ? '隐藏' : '显示'}
                    >
                      {layer.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleLock?.(layer.id)
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded transition-colors',
                        layer.locked
                          ? 'text-brand-400 hover:text-brand-600'
                          : 'text-paper-400 hover:text-paper-600'
                      )}
                      title={layer.locked ? '解锁' : '锁定'}
                    >
                      {layer.locked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-paper-200 px-4 py-2">
        <p className="text-xs text-paper-400 text-center">
          共 {layers.length} 个图层
        </p>
      </div>
    </div>
  )
}
