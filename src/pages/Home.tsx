import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Newspaper,
  MessageSquare,
  ShoppingBag,
  Tv,
  Search,
  Play,
  Users,
  Flame,
  Eye,
  Clock,
  ChevronRight,
  Shield,
  Building,
  Car,
  Heart,
  GraduationCap,
  Briefcase,
  Home as HomeIcon,
  UsersRound,
  TrendingUp,
  Trophy,
  MapPin,
  LogIn,
  UserPlus,
  Vote,
  ScanLine,
  Store,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface NewsItem {
  id: number
  title: string
  summary: string
  cover_image: string | null
  source: string
  published_at: string
  view_count: number
  category_id: number
}

interface LiveStream {
  id: number
  title: string
  cover_image: string | null
  viewer_count: number
  status: string
  description: string | null
}

interface TopicOption {
  id: number
  content: string
  vote_count: number
  sort_order: number
}

interface Topic {
  id: number
  title: string
  description: string
  participant_count: number
  max_select: number
  options: TopicOption[]
}

interface GroupBuy {
  id: number
  title: string
  product_name: string
  product_cover_image: string | null
  product_original_price: number
  original_price: number
  discount_price: number
  current_count: number
  target_count: number
  merchant_id: number | null
  traceability_code: string | null
}

interface QuizItem {
  id: number
  title: string
  description: string
  participant_count: number
  time_limit: number
  status: string
}

interface SentimentKeyword {
  keyword: string
  total_count: number
}

interface RegionalStat {
  region_code: string
  region_name: string
  user_count: number
  order_count: number
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isLoggedIn, fetchProfile } = useAuthStore()

  const [news, setNews] = useState<NewsItem[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([])
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [sentimentHot, setSentimentHot] = useState<SentimentKeyword[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadingLive, setLoadingLive] = useState(true)
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [loadingGroupBuys, setLoadingGroupBuys] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [loadingSentiment, setLoadingSentiment] = useState(true)
  const [loadingRegional, setLoadingRegional] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isLoggedIn && !user) fetchProfile()
  }, [isLoggedIn, user, fetchProfile])

  useEffect(() => {
    api.get<{ list: NewsItem[]; total: number }>('/news?page=1&pageSize=6')
      .then((data) => setNews(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingNews(false))
  }, [])

  useEffect(() => {
    api.get<LiveStream[]>('/live-streams')
      .then((data) => setLiveStreams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingLive(false))
  }, [])

  useEffect(() => {
    api.get<{ list: Topic[]; total: number }>('/topics?status=active')
      .then((data) => setTopics(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingTopics(false))
  }, [])

  useEffect(() => {
    api.get<{ list: GroupBuy[]; total: number }>('/group-buys?status=active')
      .then((data) => setGroupBuys(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingGroupBuys(false))
  }, [])

  useEffect(() => {
    api.get<{ list: QuizItem[]; total: number }>('/quizzes')
      .then((data) => setQuizzes(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingQuizzes(false))
  }, [])

  useEffect(() => {
    api.get<SentimentKeyword[]>('/sentiment/hot')
      .then((data) => setSentimentHot(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingSentiment(false))
  }, [])

  useEffect(() => {
    api.get<RegionalStat[]>('/regions/heat-map')
      .then((data) => setRegionalStats(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingRegional(false))
  }, [])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/news?keyword=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const quickActions = [
    { icon: Newspaper, label: '政务服务', desc: '查看最新政务资讯', cta: '立即查看', path: '/news' },
    { icon: MessageSquare, label: '民生互动', desc: '参与话题投票答题', cta: '去互动', path: '/topics' },
    { icon: ShoppingBag, label: '社区团购', desc: '广电甄选品质保证', cta: '去团购', path: '/group-buys' },
    { icon: Tv, label: '直播回看', desc: '看电视栏目回放', cta: '看电视', path: '/live' },
  ]

  const govServices = [
    { icon: Shield, label: '社保查询', link: '#' },
    { icon: Building, label: '公积金', link: '#' },
    { icon: UsersRound, label: '户籍办理', link: '#' },
    { icon: Car, label: '交通违章', link: '#' },
    { icon: Heart, label: '医保服务', link: '#' },
    { icon: GraduationCap, label: '教育报名', link: '#' },
    { icon: Briefcase, label: '就业登记', link: '#' },
    { icon: HomeIcon, label: '不动产查询', link: '#' },
  ]

  const programSchedule = [
    { time: '07:00', name: '早间新闻' },
    { time: '08:00', name: '百姓关注晨报' },
    { time: '12:00', name: '午间新闻' },
    { time: '18:30', name: '百姓关注' },
    { time: '19:00', name: '贵州新闻联播' },
    { time: '22:00', name: '晚间新闻' },
  ]

  const sentimentColors = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-yellow-100 text-yellow-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
  ]

  const maxUserCount = regionalStats.length > 0
    ? Math.max(...regionalStats.map(r => r.user_count), 1)
    : 1

  const isAdmin = user?.role === 'admin'
  const isMerchant = user?.role === 'merchant'

  return (
    <div>
      <section className="h-80 bg-gradient-to-r from-red-700 to-red-900 text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">百姓关注</h1>
        <p className="text-red-200 text-lg mb-6">贵州省级媒体融合公共服务平台</p>
        <div className="w-full max-w-xl relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="搜索资讯、服务、话题..."
            className="w-full h-12 px-5 pr-12 rounded-full bg-white/10 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <action.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
              <span className="text-xs text-red-200 text-center">{action.desc}</span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full mt-1">{action.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {isLoggedIn && user ? (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {user.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">欢迎回来，{user.real_name || user.username}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isAdmin ? 'bg-red-100 text-red-700' :
                      isMerchant ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isAdmin ? '管理员' : isMerchant ? '商户' : '用户'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">享受更多专属服务</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/orders" className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
                  <ClipboardList className="w-4 h-4" />我的订单
                </Link>
                <Link to="/profile" className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
                  <Users className="w-4 h-4" />个人中心
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 shadow-sm">
                    <LayoutDashboard className="w-4 h-4" />管理后台
                  </Link>
                )}
                {isMerchant && (
                  <Link to="/merchants" className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 shadow-sm">
                    <Store className="w-4 h-4" />商户入驻进度
                  </Link>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">登录后享受更多服务</p>
                  <p className="text-sm text-gray-500">参与投票、团购、答题等互动功能</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/login" className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                  <LogIn className="w-4 h-4" />登录
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  <UserPlus className="w-4 h-4" />注册
                </Link>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              最新资讯
            </h2>
            <Link to="/news" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
              查看全部资讯 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2"><Skeleton className="h-64" /></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to={`/news/${news[0].id}`} className="md:col-span-2 group">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-red-300" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">资讯</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3 h-3" />{news[0].view_count}</span>
                    </div>
                    <h3 className="text-xl font-semibold group-hover:text-red-600 transition-colors mb-2 line-clamp-2">{news[0].title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{news[0].summary}</p>
                    <span className="text-red-600 text-sm font-medium">阅读详情 →</span>
                  </div>
                </div>
              </Link>
              <div className="space-y-3">
                {news.slice(1).map((item) => (
                  <Link key={item.id} to={`/news/${item.id}`} className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-xs rounded bg-red-50 text-red-600">资讯</span>
                      <span className="text-xs text-gray-400">{formatDate(item.published_at)}</span>
                    </div>
                    <h4 className="font-medium text-sm group-hover:text-red-600 transition-colors line-clamp-1">{item.title}</h4>
                    <Link to={`/news/${item.id}`} className="text-xs text-red-500 hover:underline mt-1 inline-block">查看</Link>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">暂无资讯数据</p>
              <Link to="/news" className="text-red-600 text-sm hover:underline">浏览资讯频道 →</Link>
            </div>
          )}
          {isAdmin && (
            <div className="mt-4 text-right">
              <Link to="/admin/news" className="text-sm text-red-600 hover:underline flex items-center gap-1 justify-end">
                管理新闻 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Tv className="w-6 h-6 text-red-600" />
              电视直播 + 节目单
            </h2>
            <Link to="/live" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
              查看完整节目单 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {loadingLive ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
              ) : liveStreams.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {liveStreams.map((stream) => (
                    <div key={stream.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-32 bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center relative">
                        <Play className="w-8 h-8 text-indigo-400" />
                        {stream.status === 'live' ? (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            回放
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm line-clamp-1 mb-1">{stream.title}</h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                          <Eye className="w-3 h-3" />{stream.viewer_count} 人观看
                        </p>
                        {stream.status === 'live' ? (
                          <Link to="/live" className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />正在直播 · 进入直播
                          </Link>
                        ) : (
                          <Link to="/live" className="inline-flex items-center gap-1 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
                            可回看 · 观看回放
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-xl">
                  <p className="text-gray-400 mb-3">暂无直播数据</p>
                  <Link to="/live" className="text-red-600 text-sm hover:underline">进入直播频道 →</Link>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                今日节目单
              </h3>
              <div className="space-y-3">
                {programSchedule.map((item) => (
                  <div key={item.time} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-red-600 font-semibold w-12">{item.time}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                ))}
              </div>
              <Link to="/live" className="mt-4 text-sm text-red-600 hover:underline flex items-center gap-1">
                查看完整节目单 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-red-600" />
              热门话题
            </h2>
            <Link to="/topics" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
              查看更多话题 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingTopics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topics.slice(0, 4).map((topic) => {
                const totalVotes = topic.options.reduce((sum, o) => sum + o.vote_count, 0)
                return (
                  <div key={topic.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 line-clamp-1">{topic.title}</h4>
                      <span className="shrink-0 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">进行中</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <Users className="w-3 h-3" />{topic.participant_count} 人参与
                    </p>
                    <div className="space-y-2 mb-4">
                      {topic.options.slice(0, 3).map((option) => {
                        const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
                        return (
                          <div key={option.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{option.content}</span>
                              <span className="text-gray-400">{pct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Link to={`/topics/${topic.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                      <Vote className="w-4 h-4" />立即投票
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">暂无活跃话题</p>
              <Link to="/topics" className="text-red-600 text-sm hover:underline">浏览全部话题 →</Link>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-red-600" />
              互动答题
            </h2>
            <Link to="/quizzes" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
              查看全部答题 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingQuizzes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.slice(0, 3).map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-28 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white/80" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{quiz.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quiz.participant_count} 人参与</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.time_limit}秒/题</span>
                    </div>
                    <Link to={`/quizzes/${quiz.id}/play`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 w-full justify-center">
                      <Play className="w-4 h-4" />开始答题
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">暂无答题活动</p>
              <Link to="/quizzes" className="text-red-600 text-sm hover:underline">浏览全部答题 →</Link>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-red-600" />
              社区团购
            </h2>
            <Link to="/group-buys" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
              查看更多团购 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingGroupBuys ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : groupBuys.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {groupBuys.slice(0, 4).map((item) => {
                const progress = item.target_count > 0 ? Math.min((item.current_count / item.target_count) * 100, 100) : 0
                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative">
                      <ShoppingBag className="w-10 h-10 text-orange-300" />
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                        <Shield className="w-3 h-3" />广电担保
                      </span>
                      {item.traceability_code && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                          <ScanLine className="w-3 h-3" />溯源
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">{item.product_name || item.title}</h4>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-red-600 font-bold text-lg">¥{item.discount_price}</span>
                        <span className="text-gray-400 text-xs line-through">¥{item.original_price}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mb-2">已团{item.current_count}件 / 目标{item.target_count}件</p>
                      <Link to={`/group-buys/${item.id}`} className="inline-flex items-center justify-center w-full gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                        立即参团
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">暂无团购活动</p>
              <Link to="/group-buys" className="text-red-600 text-sm hover:underline">浏览全部团购 →</Link>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              舆情热词
            </h2>
            {isAdmin ? (
              <Link to="/admin/sentiment" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
                查看更多舆情 <ChevronRight className="w-4 h-4" />
              </Link>
            ) : null}
          </div>
          {loadingSentiment ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
            </div>
          ) : sentimentHot.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap gap-3">
                {sentimentHot.map((item, i) => {
                  const maxCount = Math.max(...sentimentHot.map(s => s.total_count), 1)
                  const sizeRatio = item.total_count / maxCount
                  const fontSize = Math.max(0.75, sizeRatio * 1.5)
                  return (
                    <span
                      key={item.keyword}
                      className={`px-3 py-1.5 rounded-full font-medium ${sentimentColors[i % sentimentColors.length]}`}
                      style={{ fontSize: `${fontSize}rem` }}
                    >
                      {item.keyword} ({item.total_count})
                    </span>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl">
              <p className="text-gray-400">暂无舆情数据</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-600" />
              地域热度
            </h2>
            {isAdmin && (
              <Link to="/admin" className="text-red-600 text-sm flex items-center gap-1 hover:underline">
                查看详细数据 <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          {loadingRegional ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : regionalStats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {regionalStats.map((region) => {
                const ratio = maxUserCount > 0 ? region.user_count / maxUserCount : 0
                const barColor = ratio > 0.7 ? 'bg-red-500' : ratio > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                const textColor = ratio > 0.7 ? 'text-red-700' : ratio > 0.4 ? 'text-yellow-700' : 'text-green-700'
                return (
                  <div key={region.region_code} className="bg-white rounded-xl shadow-sm p-4">
                    <p className="font-medium text-gray-900 text-sm mb-1">{region.region_name}</p>
                    <p className={`text-xs mb-2 ${textColor}`}>{region.user_count} 用户</p>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(ratio * 100, 3)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{region.order_count} 订单</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl">
              <p className="text-gray-400">暂无地域数据</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            便民服务
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {govServices.map((service) => (
              <Link
                key={service.label}
                to={service.link}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white shadow hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <service.icon className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs text-gray-600">{service.label}</span>
                <span className="text-xs text-red-500">立即办理 →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
