import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  UserCircle2,
  Image,
  ZoomIn,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Image as AntImage } from 'antd';
import dayjs from 'dayjs';
import { cn } from '@/utils/cn';
import type { WorkOrderStatus } from '@/components/common/StatusBadge';

export interface TimelineNode {
  id: string;
  status: WorkOrderStatus;
  title: string;
  description?: string;
  operator: string;
  operatorAvatar?: string;
  time: string | Date;
  thumbnails?: string[];
}

interface WorkOrderTimelineProps {
  nodes: TimelineNode[];
  className?: string;
}

const statusConfig: Record<WorkOrderStatus, {
  icon: LucideIcon;
  color: string;
  bg: string;
  dot: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-warning-400',
    bg: 'bg-warning-500/15',
    dot: 'bg-warning-500',
  },
  assigned: {
    icon: UserCircle2,
    color: 'text-primary-400',
    bg: 'bg-primary-500/15',
    dot: 'bg-primary-500',
  },
  processing: {
    icon: Clock,
    color: 'text-primary-400',
    bg: 'bg-primary-500/15',
    dot: 'bg-primary-500',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-success-400',
    bg: 'bg-success-500/15',
    dot: 'bg-success-500',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-neutral-400',
    bg: 'bg-neutral-500/15',
    dot: 'bg-neutral-500',
  },
  overdue: {
    icon: XCircle,
    color: 'text-danger-400',
    bg: 'bg-danger-500/15',
    dot: 'bg-danger-500',
  },
};

function ThumbnailPreview({
  thumbnails,
  initialIndex = 0,
  onClose,
}: {
  thumbnails: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="glass-card p-4">
          <AntImage
            src={thumbnails[currentIndex]}
            alt={`预览 ${currentIndex + 1}`}
            className="w-full max-h-[70vh] object-contain rounded-lg"
            preview={false}
          />

          {thumbnails.length > 1 && (
            <div className="mt-4 flex gap-2 justify-center overflow-x-auto pb-2">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                    currentIndex === idx
                      ? 'border-primary-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img
                    src={thumb}
                    alt={`缩略图 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-sm text-neutral-400">
          {currentIndex + 1} / {thumbnails.length}
        </div>
      </div>
    </div>
  );
}

export function WorkOrderTimeline({ nodes, className }: WorkOrderTimelineProps) {
  const [previewState, setPreviewState] = useState<{
    thumbnails: string[];
    index: number;
  } | null>(null);

  return (
    <>
      <div className={cn('relative', className)}>
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 via-white/10 to-transparent" />

        <div className="space-y-6">
          {nodes.map((node, index) => {
            const config = statusConfig[node.status];
            const Icon = config.icon;
            const isLast = index === nodes.length - 1;

            return (
              <div key={node.id} className="relative pl-12">
                <div
                  className={cn(
                    'absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-neutral-900 z-10',
                    config.bg
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>

                <div
                  className={cn(
                    'glass-card p-4 transition-all duration-300 hover:border-white/20',
                    isLast && 'border-primary-500/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-white m-0">{node.title}</h4>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            config.bg,
                            config.color
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
                          {
                            {
                              pending: '待处理',
                              assigned: '已派单',
                              processing: '处理中',
                              completed: '已完成',
                              cancelled: '已取消',
                              overdue: '已超时',
                            }[node.status]
                          }
                        </span>
                      </div>

                      {node.description && (
                        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                          {node.description}
                        </p>
                      )}

                      {node.thumbnails && node.thumbnails.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {node.thumbnails.map((thumb, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                setPreviewState({ thumbnails: node.thumbnails!, index: idx })
                              }
                              className="group relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all"
                            >
                              <img
                                src={thumb}
                                alt={`附件 ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          ))}
                          {node.thumbnails.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-neutral-400">
                              +{node.thumbnails.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        {node.operatorAvatar ? (
                          <img
                            src={node.operatorAvatar}
                            alt={node.operator}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <UserCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-sm text-neutral-300">{node.operator}</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {dayjs(node.time).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewState && (
        <ThumbnailPreview
          thumbnails={previewState.thumbnails}
          initialIndex={previewState.index}
          onClose={() => setPreviewState(null)}
        />
      )}
    </>
  );
}
