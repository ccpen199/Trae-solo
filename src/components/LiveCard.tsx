import { Link } from 'react-router-dom'
import { Eye, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'
import SmartImage from './SmartImage'

export interface LiveCardProps {
  id: number
  coverImage: string
  title: string
  hostName: string
  hostAvatar?: string
  viewerCount: number
  status: 'live' | 'scheduled' | 'ended' | 'replay'
  category: string
  scheduledAt?: string
}

const categoryLabels: Record<string, string> = {
  house_viewing: '看房',
  renovation: '装修',
  design: '设计',
  legal: '法律',
}

export default function LiveCard({
  id,
  coverImage,
  title,
  hostName,
  hostAvatar,
  viewerCount,
  status,
  category,
}: LiveCardProps) {
  return (
    <Link to={`/live/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="relative aspect-video overflow-hidden">
          <SmartImage
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackText="直播封面"
            aspectRatio="16/9"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            {status === 'live' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                直播中
              </span>
            )}
            {status === 'scheduled' && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                预告
              </span>
            )}
            {status === 'ended' && (
              <span className="px-2.5 py-1 bg-slate-400 text-white text-xs font-medium rounded-full">
                已结束
              </span>
            )}
            {status === 'replay' && (
              <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                回放
              </span>
            )}
          </div>

          {status === 'live' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
              <Eye size={12} strokeWidth={1.5} />
              {viewerCount.toLocaleString()}
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-block px-2 py-0.5 bg-teal-500/90 text-white text-xs rounded-md mb-2">
              {categoryLabels[category] || category}
            </span>
            <h3 className="text-white font-semibold text-sm line-clamp-2">{title}</h3>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-teal-100')}>
              {hostAvatar ? (
                <img src={stableImageUrl(hostAvatar, hostName)} alt={hostName} className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-teal-600" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 font-medium truncate">{hostName}</p>
              {status === 'live' && (
                <p className="text-xs text-slate-500">
                  <span className="text-teal-600 font-medium">{viewerCount.toLocaleString()}</span> 人观看
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
