import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ContentCard from '../components/ContentCard'
import TopicBadge from '../components/TopicBadge'
import api from '../utils/api'
import { Loader2, Flame, Clock, Star, Users, MapPin, Info, Compass } from 'lucide-react'
import { isAuthenticated } from '../utils/auth'

interface Topic {
  id: string
  name: string
  slug: string
  post_count?: number
}

interface Content {
  id: string
  title: string
  summary?: string
  cover_image?: string
  content_type: string
  user_id?: number
  author_nickname?: string
  author_avatar?: string
  topic_ids?: string
  city?: string
  like_count: number
  comment_count: number
  collect_count: number
  view_count: number
  hot_score?: number
  is_featured?: number
  is_pinned?: number
  created_at: string
}

const tabs = [
  { key: 'recommend', label: '推荐', icon: Star, desc: '算法推荐' },
  { key: 'following', label: '关注', icon: Users, desc: '订阅内容' },
  { key: 'latest', label: '最新', icon: Clock, desc: '时间排序' },
  { key: 'hot', label: '热门', icon: Flame, desc: '互动排序' },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'recommend')
  const [contents, setContents] = useState<Content[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [city, setCity] = useState(searchParams.get('city') || '')

  useEffect(() => {
    api.get('/api/topics', { params: { limit: 10 } }).then(res => {
      if (res.data.code === 0) {
        setTopics(Array.isArray(res.data.data) ? res.data.data : [])
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    const params: Record<string, string | number> = { page: 1, pageSize: 12 }
    if (activeTab === 'latest') params.sort = 'latest'
    else if (activeTab === 'hot') params.sort = 'hot'
    else if (activeTab === 'following') params.following = '1'
    else if (activeTab === 'recommend') params.recommend = '1'
    if (city) params.city = city

    api.get('/api/contents', { params }).then(res => {
      if (res.data.code === 0) {
        const list = res.data.data.list || []
        setContents(list)
        setHasMore(list.length >= 12)
      }
    }).catch(() => {
      setContents([])
    }).finally(() => setLoading(false))
  }, [activeTab, city])

  const loadMore = async () => {
    const nextPage = page + 1
    const params: Record<string, string | number> = { page: nextPage, pageSize: 12 }
    if (activeTab === 'latest') params.sort = 'latest'
    else if (activeTab === 'hot') params.sort = 'hot'
    else if (activeTab === 'following') params.following = '1'
    else if (activeTab === 'recommend') params.recommend = '1'
    if (city) params.city = city

    try {
      const res = await api.get('/api/contents', { params })
      if (res.data.code === 0) {
        const newItems = res.data.data.list || []
        setContents(prev => [...prev, ...newItems])
        setPage(nextPage)
        setHasMore(newItems.length >= 12)
      }
    } catch {}
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center gap-2 border-b border-gray-200 flex-wrap">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">城市：</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="筛选城市，如：北京、上海"
              className="input-field flex-1 text-sm py-1.5"
            />
            {city && (
              <button onClick={() => setCity('')} className="text-xs text-gray-500 hover:text-gray-700">
                清除
              </button>
            )}
          </div>
        </div>

        {activeTab === 'hot' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium text-red-700 mb-1">热榜依据：点赞×3 + 浏览×1 + 评论×5 + 收藏×2，运营可置顶/精选干预</p>
                <p className="text-gray-500">分数越高排名越靠前，热门内容将获得更多曝光机会</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'following' && !isAuthenticated() && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <Info className="w-4 h-4" />
              登录后才能查看关注的创作者和话题内容
            </div>
          </div>
        )}
        {activeTab === 'following' && isAuthenticated() && contents.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Users className="w-4 h-4" />
              以下是您关注的创作者和话题内容
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">
              {activeTab === 'following' ? '您还没有关注任何创作者或话题' : '暂无内容'}
            </p>
            <p className="text-sm mb-4">
              {activeTab === 'following'
                ? '去发现页看看吧'
                : '快来发布第一篇内容吧'}
            </p>
            {activeTab === 'following' && (
              <Link to="/explore" className="btn-primary inline-flex items-center gap-1">
                <Compass className="w-4 h-4" />去发现
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contents.map((content, index) => (
                <div key={content.id} className="relative">
                  <ContentCard
                    content={content}
                    showRank={activeTab === 'hot' ? index + 1 : undefined}
                    showHotScore={activeTab === 'hot'}
                  />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-6">
                <button onClick={loadMore} className="btn-secondary">加载更多</button>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="hidden lg:block w-72 shrink-0 space-y-4">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">热门话题</h3>
          <div className="space-y-2">
            {topics.map(topic => (
              <div key={topic.id} className="flex items-center justify-between">
                <TopicBadge name={topic.name} slug={topic.slug} size="md" />
                <span className="text-xs text-gray-400">{topic.post_count || 0} 篇</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <Link to="/create" className="btn-primary w-full justify-center">开始创作</Link>
        </div>
      </aside>
    </div>
  )
}
