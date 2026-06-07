import { Link } from 'react-router-dom'
import { Heart, Bookmark, User, Play, FileText, Image } from 'lucide-react'
import { stableImageUrl } from '@/lib/media'
import SmartImage from './SmartImage'

export interface ContentCardProps {
  id: number
  title: string
  excerpt?: string
  contentType: 'article' | 'video' | 'image'
  authorName: string
  authorAvatar?: string
  mediaUrls: string
  likeCount: number
  collectCount: number
  viewCount?: number
}

export default function ContentCard({
  id,
  title,
  excerpt,
  contentType,
  authorName,
  authorAvatar,
  mediaUrls,
  likeCount,
  collectCount,
}: ContentCardProps) {
  const mediaList = mediaUrls ? JSON.parse(mediaUrls) : []
  const firstMedia = mediaList[0] || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=600'

  const ContentTypeIcon = {
    article: FileText,
    video: Play,
    image: Image,
  }[contentType]

  const contentTypeLabel = {
    article: '文章',
    video: '视频',
    image: '图集',
  }[contentType]

  return (
    <Link to={`/content/${id}`} className="group block masonry-item">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="relative">
          <SmartImage
            src={firstMedia}
            alt={title}
            className="w-full object-cover aspect-[4/3]"
            fallbackText="内容图片"
            aspectRatio="4/3"
          />
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full">
              {ContentTypeIcon && <ContentTypeIcon size={12} strokeWidth={1.5} />}
              {contentTypeLabel}
            </span>
          </div>
          {contentType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={24} className="text-teal-600 ml-1" fill="currentColor" strokeWidth={1.5} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{excerpt}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                {authorAvatar ? (
                  <img src={stableImageUrl(authorAvatar, authorName)} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-teal-600" strokeWidth={1.5} />
                )}
              </div>
              <span className="text-xs text-slate-600 font-medium">{authorName}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Heart size={14} strokeWidth={1.5} />
                {likeCount}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Bookmark size={14} strokeWidth={1.5} />
                {collectCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
