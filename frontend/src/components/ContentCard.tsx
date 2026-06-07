import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, CheckCircle, Shield, Zap, MapPin, Flame, UserPlus, Crown } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const creatorLevels: Record<number, { name: string; color: string; bg: string }> = {
  0: { name: '新手创作者', color: 'text-gray-600', bg: 'bg-gray-100' },
  1: { name: '活跃创作者', color: 'text-green-600', bg: 'bg-green-100' },
  2: { name: '优质创作者', color: 'text-blue-600', bg: 'bg-blue-100' },
  3: { name: '精品创作者', color: 'text-purple-600', bg: 'bg-purple-100' },
  4: { name: '顶级创作者', color: 'text-amber-600', bg: 'bg-amber-100' },
}

export interface ContentItem {
  id: number | string
  title: string
  summary?: string
  cover_image?: string
  content_type: string
  user_id?: number | string
  author_nickname?: string
  author_avatar?: string
  author_level?: number
  author_level_name?: string
  author_certified?: number
  author_role?: string
  hot_score?: number
  is_following_author?: boolean
  is_pinned?: number
  is_featured?: number
  review_status?: string
  topics?: { id: number | string; name: string; slug: string }[]
  topic_ids?: string
  city?: string
  like_count: number
  comment_count: number
  collect_count: number
  view_count?: number
  has_sensitive_words?: number
  created_at: string
  [key: string]: any
}

interface ContentCardProps {
  content: ContentItem
  showRank?: number
  showHotScore?: boolean
}

export default function ContentCard({ content, showRank, showHotScore }: ContentCardProps) {
  const level = creatorLevels[content.author_level || 0] || creatorLevels[0]
  const levelName = content.author_level_name || level.name

  let parsedTopics = content.topics || []
  if (content.topic_ids && !content.topics) {
    try {
      const topicArray = JSON.parse(content.topic_ids)
      parsedTopics = topicArray.map((t: any) => ({
        id: t.id || t,
        name: t.name || t,
        slug: t.slug || t
      }))
    } catch {}
  }

  return (
    <div className="card hover:shadow-md transition-shadow group">
      {showRank !== undefined && (
        <div className="absolute -top-2 -left-2 z-20 w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
          {showRank}
        </div>
      )}
      {(content.is_pinned || content.is_featured) && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {content.is_pinned && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">置顶</span>
          )}
          {content.is_featured && !content.is_pinned && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">精选</span>
          )}
        </div>
      )}
      <Link to={`/content/${content.id}`} className="block">
        {content.cover_image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={content.cover_image}
              alt={content.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {content.content_type && (
              <span className="badge bg-primary-50 text-primary-600">
                {content.content_type === 'article' ? '文章' : content.content_type === 'note' ? '笔记' : '动态'}
              </span>
            )}
            {content.city && (
              <span className="badge bg-orange-50 text-orange-600 flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{content.city}
              </span>
            )}
            {showHotScore && content.hot_score !== undefined && (
              <span className="badge bg-red-50 text-red-600 flex items-center gap-0.5">
                <Flame className="w-3 h-3" />{content.hot_score}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
            {content.title}
          </h3>
          {content.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{content.summary}</p>
          )}
          {parsedTopics && parsedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {parsedTopics.slice(0, 3).map((topic: any) => (
                <span
                  key={topic.id || topic.slug}
                  className="inline-flex items-center text-primary-600 bg-primary-50 rounded-full text-xs px-2 py-0.5"
                >
                  #{topic.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {content.author_avatar ? (
                <img src={content.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
              )}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{content.author_nickname}</span>
                {content.author_certified === 1 && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                )}
              </div>
              {content.author_role === 'admin' && (
                <span className="badge bg-red-100 text-red-600 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" />管理员
                </span>
              )}
              {content.author_role === 'author' && content.author_level === undefined && (
                <span className="badge bg-purple-100 text-purple-600 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />创作者
                </span>
              )}
              {content.author_level !== undefined && content.author_level > 0 && (
                <span className={`badge ${level.bg} ${level.color} text-[10px] px-1.5 py-0 flex items-center gap-0.5`}>
                  <Crown className="w-2.5 h-2.5" />{levelName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" />{content.like_count}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="w-3.5 h-3.5" />{content.comment_count}</span>
              <span className="flex items-center gap-0.5"><Bookmark className="w-3.5 h-3.5" />{content.collect_count}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">
              {dayjs(content.created_at).format('YYYY-MM-DD HH:mm')}
            </div>
            {content.is_following_author === false && content.author_role !== undefined && (
              <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" />关注
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
