import { useState } from 'react'
import {
  Share2,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share as ShareIcon,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  Play,
  FileText,
  Image,
  Video,
  Bookmark,
} from 'lucide-react'
import { useBusinessStore } from '@/store/business'

const materials = [
  {
    id: 'M001',
    title: '国珍松花粉片产品介绍',
    type: 'article',
    category: '产品知识',
    views: 1286,
    shares: 342,
    conversions: 89,
    cover: '🌰',
    gradient: 'from-amber-100 to-orange-100',
    duration: '5 分钟阅读',
    date: '2026-06-10',
    bookmarked: true,
  },
  {
    id: 'M002',
    title: '免疫力提升方案全解析',
    type: 'video',
    category: '健康科普',
    views: 2451,
    shares: 678,
    conversions: 156,
    cover: '🎬',
    gradient: 'from-sky-100 to-blue-100',
    duration: '12:35',
    date: '2026-06-08',
    bookmarked: false,
  },
  {
    id: 'M003',
    title: '新客户沟通话术手册',
    type: 'article',
    category: '展业技巧',
    views: 892,
    shares: 234,
    conversions: 67,
    cover: '📖',
    gradient: 'from-violet-100 to-purple-100',
    duration: '8 分钟阅读',
    date: '2026-06-05',
    bookmarked: true,
  },
  {
    id: 'M004',
    title: '618 促销活动海报',
    type: 'image',
    category: '营销素材',
    views: 3892,
    shares: 1205,
    conversions: 234,
    cover: '🎨',
    gradient: 'from-rose-100 to-pink-100',
    duration: '高清图片',
    date: '2026-06-01',
    bookmarked: false,
  },
  {
    id: 'M005',
    title: '竹康宁产品知识讲解',
    type: 'video',
    category: '产品知识',
    views: 1678,
    shares: 445,
    conversions: 98,
    cover: '🎋',
    gradient: 'from-emerald-100 to-teal-100',
    duration: '08:42',
    date: '2026-05-28',
    bookmarked: false,
  },
  {
    id: 'M006',
    title: '老客户维护与复购技巧',
    type: 'article',
    category: '展业技巧',
    views: 756,
    shares: 189,
    conversions: 45,
    cover: '💡',
    gradient: 'from-indigo-100 to-violet-100',
    duration: '6 分钟阅读',
    date: '2026-05-25',
    bookmarked: true,
  },
]

const typeIcon: Record<string, typeof FileText> = {
  article: FileText,
  video: Video,
  image: Image,
}

const typeLabel: Record<string, string> = {
  article: '文章',
  video: '视频',
  image: '图片',
}

const categories = ['全部', '产品知识', '健康科普', '展业技巧', '营销素材']

export default function Share() {
  const { addToast, addShareTrack } = useBusinessStore()
  const [activeCategory, setActiveCategory] = useState('全部')

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    addToast({ type: 'success', title: '分类已切换', description: `已切换至「${category}」分类` })
  }

  const handleShareMaterial = (material: typeof materials[0]) => {
    addToast({ type: 'success', title: '分享已就绪', description: `正在分享《${material.title}` })
    addShareTrack({
      materialId: material.id,
      materialTitle: material.title,
      views: material.views,
      clicks: material.shares,
      conversions: material.conversions,
      channel: '内容分享',
    })
  }

  const handleStatClick = (label: string, value: string) => {
    addToast({ type: 'success', title: `${label}明细`, description: `${label}：${value}，数据实时更新中` })
  }

  const handlePublishMaterial = () => {
    addToast({ type: 'success', title: '发布素材', description: '正在跳转至素材发布页面...' })
  }

  const stats = [
    { label: '累计浏览', value: '18,562', icon: Eye, color: 'from-sky-500 to-blue-600' },
    { label: '累计分享', value: '3,892', icon: Share2, color: 'from-violet-500 to-purple-600' },
    { label: '获客转化', value: '689', icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: '转化率', value: '3.7%', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Share2 className="w-7 h-7 text-sky-600" />
            内容分享
          </h1>
          <p className="text-slate-500 text-sm mt-1">传播效果追踪 · 分享转化分析</p>
        </div>
        <button
          onClick={handlePublishMaterial}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <ShareIcon className="w-4 h-4" />
          发布素材
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              onClick={() => handleStatClick(s.label, s.value)}
              className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索分享素材..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:bg-white transition"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => handleCategoryChange(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === c
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-2 whitespace-nowrap">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => {
          const TypeIcon = typeIcon[m.type]
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div
                className={`relative h-44 bg-gradient-to-br ${m.gradient} flex items-center justify-center`}
              >
                <span className="text-6xl group-hover:scale-110 transition-transform">{m.cover}</span>
                <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium bg-white/90 backdrop-blur rounded-lg text-slate-700 flex items-center gap-1">
                  <TypeIcon className="w-3 h-3" />
                  {typeLabel[m.type]}
                </span>
                {m.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-slate-800 ml-1" />
                    </div>
                  </div>
                )}
                <button
                  className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur transition ${
                    m.bookmarked
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/90 text-slate-500 hover:text-amber-500'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${m.bookmarked ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute bottom-3 right-3 px-2 py-1 text-xs bg-black/60 backdrop-blur text-white rounded-md flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {m.duration}
                </div>
              </div>

              <div className="p-4">
                <div className="text-xs text-sky-600 font-medium">{m.category}</div>
                <h3 className="mt-1 font-semibold text-slate-800 line-clamp-2 group-hover:text-sky-600 transition min-h-[3rem]">
                  {m.title}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-700 font-semibold text-sm">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {m.views.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">浏览</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-700 font-semibold text-sm">
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      {m.shares.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">分享</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold text-sm">
                      <Users className="w-3.5 h-3.5" />
                      {m.conversions}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">转化</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{m.date}</span>
                  <button
                    onClick={() => handleShareMaterial(m)}
                    className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg flex items-center gap-1.5 hover:shadow-md transition">
                    <ShareIcon className="w-3.5 h-3.5" />
                    立即分享
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
