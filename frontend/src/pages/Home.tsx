import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import {
  getHotspotNews,
  getNearbyNews,
  getNewsRecommendations,
  getVideos,
  getCreators,
  getTasks,
  getBeanBalance,
  getDashboard,
  updateLocation,
} from '../api/client'
import { useApp } from '../context/AppContext'
import { formatDistance, formatTime, getCredibilityLabel, getLevelStars } from '../hooks'

interface NewsItem {
  id: string
  title: string
  summary: string
  source_name: string
  source_credibility: number
  distance?: number
  created_at: string
  category: string
}

interface VideoItem {
  id: string
  title: string
  cover_url: string
  duration: number
  play_completion_rate: number
  view_count: number
}

interface CreatorItem {
  id: string
  creator_name: string
  creator_level: number
  follower_count: number
  verified: boolean
}

interface TaskItem {
  id: string
  title: string
  lili_beans_reward: number
  status: string
}

const quickActions = [
  { to: '/news/nearby', icon: '📍', title: '附近热点', subtitle: '发现身边', badge: '3km内' },
  { to: '/news', icon: '💡', title: '个性推荐', subtitle: '智能匹配', badge: '双通道' },
  { to: '/videos', icon: '🎬', title: '热门视频', subtitle: '沉浸观看', badge: '互动热区' },
  { to: '/creators', icon: '✨', title: '创作者', subtitle: '关注互动', badge: '里里号' },
  { to: '/tasks', icon: '🎯', title: '做任务', subtitle: '赚取里里豆', badge: '每日任务' },
  { to: '/beans', icon: '🫘', title: '兑换', subtitle: '话费好礼', badge: '100豆=1元' },
]

export default function Home() {
  const [hotspotNews, setHotspotNews] = useState<NewsItem[]>([])
  const [nearbyNewsList, setNearbyNewsList] = useState<NewsItem[]>([])
  const [recommended, setRecommended] = useState<NewsItem[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [creators, setCreators] = useState<CreatorItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [beanBalance, setBeanBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('user')
  const [adminStats, setAdminStats] = useState<any>(null)
  const navigate = useNavigate()
  const { user, location, requestLocation, showToast } = useApp()

  useEffect(() => {
    setUserRole(user?.role || 'user')
    loadData()
  }, [user?.role])

  const loadData = async () => {
    setLoading(true)
    try {
      const loc = location?.status === 'granted' ? location : { lat: 39.9042, lng: 116.4074 }

      const results = await Promise.allSettled([
        getHotspotNews(loc.lat, loc.lng, 5),
        getNearbyNews(loc.lat, loc.lng, 5, 1, 6),
        getNewsRecommendations(1, 6),
        getVideos({ limit: 4 }),
        getCreators({ limit: 4 }),
        getTasks(),
        getBeanBalance(),
        user?.role === 'admin' ? getDashboard() : Promise.resolve(null),
      ])

      if (results[0].status === 'fulfilled') {
        const data = results[0].value.data?.data || results[0].value.data || []
        setHotspotNews(Array.isArray(data) ? data : [])
      }
      if (results[1].status === 'fulfilled') {
        const data = results[1].value.data?.data || results[1].value.data || []
        setNearbyNewsList(Array.isArray(data) ? data : [])
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value.data?.data || results[2].value.data || []
        setRecommended(Array.isArray(data) ? data : [])
      }
      if (results[3].status === 'fulfilled') {
        const data = results[3].value.data?.data || results[3].value.data || []
        setVideos(Array.isArray(data) ? data : [])
      }
      if (results[4].status === 'fulfilled') {
        const data = results[4].value.data?.data || results[4].value.data || []
        setCreators(Array.isArray(data) ? data : [])
      }
      if (results[5].status === 'fulfilled') {
        const data = results[5].value.data?.data || results[5].value.data || []
        setTasks(Array.isArray(data) ? data : [])
      }
      if (results[6].status === 'fulfilled') {
        setBeanBalance(results[6].value.data?.balance ?? 0)
      }
      if (results[7].status === 'fulfilled' && results[7].value) {
        setAdminStats(results[7].value.data)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLocation = async () => {
    const result = await requestLocation()
    if (result) {
      try {
        await updateLocation({ latitude: result.lat, longitude: result.lng, accuracy: result.accuracy })
        showToast(`位置已同步！精度 ${Math.round(result.accuracy || 0)}m，正在刷新新闻...`, 'success')
        setTimeout(() => loadData(), 500)
      } catch {
        showToast('位置保存失败，正在刷新新闻...', 'info')
        setTimeout(() => loadData(), 500)
      }
    }
  }

  const renderNewsCard = (item: NewsItem, showDistance = false) => {
    const cred = getCredibilityLabel(item.source_credibility)
    const isHot = item.source_credibility >= 0.8
    return (
      <div
        key={item.id}
        onClick={() => navigate(`/news/${item.id}`)}
        className="card p-4 cursor-pointer hover:border-primary/30 group transition-all"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>
          {isHot && <span className="badge-hot shrink-0">突发</span>}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary || item.title}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>{item.source_name || '本地资讯'}</span>
            <span className={`badge ${cred.color}`}>{cred.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {showDistance && item.distance != null && (
              <span className="text-primary font-medium">{formatDistance(item.distance)}</span>
            )}
            <span>{formatTime(item.created_at)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">欢迎回来，{user?.nickname || user?.username || '用户'}！</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    location?.status === 'granted'
                      ? 'bg-green-500'
                      : location?.status === 'pending'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                ></span>
                📍{' '}
                {location?.status === 'granted'
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}${location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}`
                  : location?.status === 'pending'
                  ? '定位中...'
                  : '未定位'}
                {location?.status === 'denied' && (
                  <button onClick={handleRequestLocation} className="text-primary hover:underline ml-1">
                    授权定位
                  </button>
                )}
              </span>
              <span>🫘 里里豆余额：<span className="text-primary font-semibold">{beanBalance}</span></span>
              <span>🎯 今日任务：{tasks.filter((t) => t.status === 'completed').length}/{tasks.length || 8}</span>
              <span>{localStorage.getItem('device_fingerprint') ? '🔒' : '🔓'} 设备指纹</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-gradient-to-r from-red-500/20 via-primary/20 to-orange-500/20 rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔴</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">1km内突发新闻</h3>
              <p className="text-sm text-gray-500">基于您的位置实时发现身边热点</p>
            </div>
          </div>
          <NavLink to="/news/nearby" className="btn-primary text-sm">
            查看全部附近资讯 →
          </NavLink>
        </div>
        {location?.status === 'granted' ? (
          hotspotNews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {hotspotNews.slice(0, 4).map((item) => renderNewsCard({ ...item, source_credibility: item.source_credibility || 0.85 }, true))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">附近暂无突发新闻</div>
          )
        ) : location?.status === 'pending' ? (
          <div className="card p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">正在获取您的位置...</p>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 mb-4">授权地理位置后，自动发现您身边的突发新闻</p>
            <button onClick={handleRequestLocation} className="btn-primary">
              📍 授权地理位置
            </button>
          </div>
        )}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm text-primary font-bold">1km</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 核心业务入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <NavLink
              key={action.to}
              to={action.to}
              className="card p-4 text-center hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
              <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{action.title}</div>
              <div className="text-xs text-gray-400 mt-1">{action.subtitle}</div>
              <span className="mt-2 inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {action.badge}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📍 附近资讯 (5km)</h3>
            <NavLink to="/news" className="text-sm text-primary hover:underline">查看更多 →</NavLink>
          </div>
          {nearbyNewsList.length > 0 ? (
            <div className="space-y-3">
              {nearbyNewsList.slice(0, 3).map((item) => renderNewsCard(item, true))}
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-400">附近暂无资讯</div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">💡 推荐资讯</h3>
            <NavLink to="/news" className="text-sm text-primary hover:underline">查看更多 →</NavLink>
          </div>
          {recommended.length > 0 ? (
            <div className="space-y-3">
              {recommended.slice(0, 3).map((item) => renderNewsCard(item))}
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-400">暂无推荐</div>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🎬 视频推荐</h3>
          <NavLink to="/videos" className="text-sm text-primary hover:underline">查看更多视频 →</NavLink>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videos.slice(0, 4).map((video) => (
            <div
              key={video.id}
              onClick={() => navigate(`/videos/${video.id}`)}
              className="card overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-4xl group-hover:scale-110 transition-transform">🎬</span>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>完播率</span>
                    <span>{(video.play_completion_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${video.play_completion_rate * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">👁️ {video.view_count} 次观看</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">✨ 创作者推荐</h3>
          <NavLink to="/creators" className="text-sm text-primary hover:underline">发现更多创作者 →</NavLink>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {creators.slice(0, 4).map((creator) => (
            <div
              key={creator.id}
              onClick={() => navigate(`/creators/${creator.id}`)}
              className="card p-4 text-center cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-secondary to-blue-600 flex items-center justify-center text-2xl text-white mb-3">
                ✨
              </div>
              <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors flex items-center justify-center gap-1">
                {creator.creator_name}
                {creator.verified && <span className="text-blue-500" title="已认证">✓</span>}
              </h4>
              <div className="mt-1">{getLevelStars(creator.creator_level)}</div>
              <p className="text-xs text-gray-400 mt-2">👥 {creator.follower_count} 粉丝</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🎯 任务与里里豆</h3>
          <NavLink to="/tasks" className="text-sm text-primary hover:underline">进入任务中心 →</NavLink>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-5 md:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-3">进行中的任务</h4>
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{task.title}</span>
                  <span className="text-sm font-semibold text-primary">+{task.lili_beans_reward} 豆</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-orange-50 to-primary/10">
            <h4 className="font-semibold text-gray-900 mb-3">里里豆余额</h4>
            <div className="text-4xl font-bold text-primary mb-2">{beanBalance}</div>
            <p className="text-sm text-gray-500 mb-4">当前汇率：1 元 = 100 豆</p>
            <NavLink to="/beans" className="btn-primary w-full text-center text-sm block">
              立即兑换 →
            </NavLink>
          </div>
        </div>
      </section>

      {userRole === 'admin' && adminStats && (
        <section className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">⚙️ 管理员专区</h3>
            <NavLink to="/admin" className="text-sm text-primary hover:underline">进入运营后台 →</NavLink>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center bg-white">
              <div className="text-2xl font-bold text-primary">{adminStats.total_users}</div>
              <div className="text-sm text-gray-500 mt-1">活跃用户</div>
            </div>
            <div className="card p-4 text-center bg-white">
              <div className="text-2xl font-bold text-yellow-600">{adminStats.total_news + adminStats.total_videos}</div>
              <div className="text-sm text-gray-500 mt-1">待审核内容</div>
            </div>
            <div className="card p-4 text-center bg-white">
              <div className="text-2xl font-bold text-red-600">{adminStats.total_creators}</div>
              <div className="text-sm text-gray-500 mt-1">创作者申请</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <NavLink to="/admin" className="btn-primary text-sm">📊 运营大屏</NavLink>
            <NavLink to="/admin/reports" className="btn-secondary text-sm">🔍 内容审核</NavLink>
            <NavLink to="/admin/creators" className="btn-secondary text-sm">👥 创作者管理</NavLink>
            <NavLink to="/admin/anti-fraud" className="btn-secondary text-sm">🛡️ 反欺诈监控</NavLink>
          </div>
        </section>
      )}
    </div>
  )
}
