import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCreatorDetail, followCreator, getCreatorContent, getCreatorStats } from '../api/client'
import { formatNumber, getLevelStars } from '../hooks'

interface CreatorData {
  id: string
  name: string
  level: number
  bio: string
  verified: boolean
  avatar?: string
  follower_count: number
  view_count: number
  like_count: number
  originality_coefficient: number
  cooperation_whitelist?: string[]
}

interface ContentItem {
  id: string
  title: string
  type: 'news' | 'video'
  created_at: string
}

export default function CreatorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState(false)
  const [contentTab, setContentTab] = useState<'news' | 'video'>('news')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.allSettled([
      getCreatorDetail(id),
      getCreatorContent(id, { type: contentTab, limit: 10 }),
      getCreatorStats(id),
    ]).then(([creatorRes, contentRes, statsRes]) => {
      if (creatorRes.status === 'fulfilled') setCreator(creatorRes.value.data)
      if (contentRes.status === 'fulfilled') setContent(contentRes.value.data?.items ?? contentRes.value.data ?? [])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
    }).finally(() => setLoading(false))
  }, [id, contentTab])

  const handleFollow = async () => {
    if (!id) return
    try {
      await followCreator(id)
      setFollowed(true)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-500">创作者不存在</p>
        <button onClick={() => navigate('/creators')} className="btn-primary mt-4 text-sm">返回创作者列表</button>
      </div>
    )
  }

  const levelProgress = ((creator.level ?? 1) / 10) * 100

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {creator.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{creator.name}</h2>
              {creator.verified && <span className="badge-verified">✓ 认证创作者</span>}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500 text-sm">{getLevelStars(creator.level)}</span>
              <span className="text-sm text-gray-500">Lv.{creator.level}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{creator.bio || '暂无简介'}</p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFollow}
                className={`text-sm px-5 py-1.5 rounded-lg font-medium transition-all ${
                  followed
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : 'btn-primary'
                }`}
              >
                {followed ? '已关注' : '+ 关注'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '粉丝', value: formatNumber(creator.follower_count ?? 0), color: 'text-primary' },
          { label: '浏览', value: formatNumber(creator.view_count ?? 0), color: 'text-secondary' },
          { label: '点赞', value: formatNumber(creator.like_count ?? 0), color: 'text-red-500' },
          { label: '原创度', value: `${((creator.originality_coefficient ?? 0) * 100).toFixed(0)}%`, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">创作者成长路径</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Lv.1</span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all duration-700" style={{ width: `${levelProgress}%` }} />
          </div>
          <span className="text-xs text-gray-500">Lv.10</span>
        </div>
        <p className="text-sm text-primary font-medium mt-2">当前等级: Lv.{creator.level}</p>
      </div>

      {creator.cooperation_whitelist && creator.cooperation_whitelist.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">商务合作白名单</h3>
          <div className="flex flex-wrap gap-2">
            {creator.cooperation_whitelist.map((name, i) => (
              <span key={i} className="text-xs bg-blue-50 text-secondary px-3 py-1 rounded-full">{name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setContentTab('news')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              contentTab === 'news' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            📰 资讯
          </button>
          <button
            onClick={() => setContentTab('video')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              contentTab === 'video' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            🎬 视频
          </button>
        </div>

        {content.length > 0 ? (
          <div className="space-y-3">
            {content.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/${item.type === 'video' ? 'videos' : 'news'}/${item.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-lg">{item.type === 'video' ? '🎬' : '📰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-1 hover:text-primary transition-colors">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">暂无{contentTab === 'video' ? '视频' : '资讯'}内容</p>
        )}
      </div>
    </div>
  )
}
