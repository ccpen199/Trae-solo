import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShoppingBag, Heart, BarChart3, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  summary: string
  source: string
  time: string
  tags: string[]
}

const HOT_TOPICS = ['元阳梯田', '过桥米线', '建水古城', '弥勒温泉', '泸西花海', '红河哈尼', '石屏豆腐', '开远蜜桃']

const QUICK_ENTRIES = [
  { name: '生活圈', icon: Users, to: '/circles', gradient: 'from-honghe-red to-honghe-red-dark' },
  { name: '本地商城', icon: ShoppingBag, to: '/shop', gradient: 'from-honghe-blue to-honghe-blue-dark' },
  { name: '婚恋匹配', icon: Heart, to: '/match', gradient: 'from-honghe-gold to-honghe-gold-light' },
  { name: '数据看板', icon: BarChart3, to: '/dashboard', gradient: 'from-honghe-green to-honghe-green-light' },
]

const GRADIENTS = [
  'from-honghe-red to-honghe-red-dark',
  'from-honghe-blue to-honghe-blue-dark',
  'from-honghe-gold to-honghe-gold-light',
  'from-honghe-green to-honghe-green-light',
]

const getGradient = (id: number) => GRADIENTS[id % GRADIENTS.length]

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data?.items || []
        const transformed = items.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: (item.content || '').slice(0, 60),
          source: item.source || '红河生活',
          time: item.created_at ? formatDate(item.created_at) : '',
          tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        }))
        setNews(transformed)
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="terrace-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-honghe-red/5 to-warm-50/80" />
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-honghe-red mb-4 animate-fade-in">
            红河生活
          </h1>
          <p className="text-warm-600 text-lg animate-slide-up">你的本地生活，从此不同</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {HOT_TOPICS.map((topic) => (
            <Link key={topic} to={`/news?tag=${encodeURIComponent(topic)}`} className="tag-red whitespace-nowrap">
              {topic}
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">资讯动态</h2>
          <Link to="/news" className="text-sm text-honghe-red flex items-center gap-1 hover:underline">
            更多 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-static p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-warm-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-warm-100 rounded w-3/4" />
                    <div className="h-4 bg-warm-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {news.slice(0, 5).map((item) => (
              <Link key={item.id} to={`/news/${item.id}`} className="card p-4 flex gap-4">
                <div
                  className={`w-32 h-24 rounded-lg bg-gradient-to-br ${getGradient(item.id)} flex items-center justify-center text-white/80 text-2xl font-serif font-bold flex-shrink-0`}
                >
                  {item.title.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-warm-800 line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-sm text-warm-500 line-clamp-2 mb-2">{item.summary}</p>
                  <div className="flex items-center gap-2 text-xs text-warm-400">
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{item.time}</span>
                    {item.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-blue !text-[10px] !px-1.5 !py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-6">
        <h2 className="section-title mb-4">快捷入口</h2>
        <div className="grid grid-cols-2 gap-4">
          {QUICK_ENTRIES.map((entry) => (
            <Link
              key={entry.name}
              to={entry.to}
              className="card p-6 flex flex-col items-center gap-3 group"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${entry.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <entry.icon className="w-7 h-7" />
              </div>
              <span className="text-sm font-medium text-warm-700">{entry.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
