import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, X, Send } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  summary: string
  source: string
  time: string
  tags: string[]
}

interface GovItem {
  id: number
  title: string
  date: string
}

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

export default function News() {
  const [searchParams] = useSearchParams()
  const tagParam = searchParams.get('tag') || ''
  const [news, setNews] = useState<NewsItem[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [govNews, setGovNews] = useState<GovItem[]>([])
  const [activeTag, setActiveTag] = useState(tagParam)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', tags: '' })

  useEffect(() => {
    setActiveTag(tagParam)
  }, [tagParam])

  useEffect(() => {
    fetch('/api/news/tags')
      .then((res) => res.json())
      .then((data) => {
        const list = data.data || []
        setTags(list.map((t: any) => t.name))
      })
      .catch(() => setTags([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = activeTag ? `/api/news?tag=${encodeURIComponent(activeTag)}` : '/api/news'
    fetch(url)
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
  }, [activeTag])

  useEffect(() => {
    fetch('/api/news/government')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data?.items || []
        const transformed = items.map((item: any) => ({
          id: item.id,
          title: item.title,
          date: item.created_at ? formatDate(item.created_at) : '',
        }))
        setGovNews(transformed)
      })
      .catch(() => setGovNews([]))
  }, [])

  const handleSubmit = () => {
    fetch('/api/news/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        tags: form.tags,
      }),
    }).then(() => {
      setShowModal(false)
      setForm({ title: '', content: '', tags: '' })
    })
  }

  return (
    <div className="container mx-auto px-4">
      <div className="sticky top-16 z-40 bg-warm-50 pt-4 pb-2">
        <div className="flex gap-3 overflow-x-auto pb-3">
          <button
            onClick={() => setActiveTag('')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all relative ${!activeTag ? 'bg-honghe-red text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTag === tag ? 'bg-honghe-red text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="ethnic-border" />
      </div>

      <div className="flex gap-6 mt-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-static p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-40 h-28 bg-warm-100 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-warm-100 rounded w-3/4" />
                      <div className="h-4 bg-warm-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <Link key={item.id} to={`/news/${item.id}`} className="card p-4 flex gap-4">
                  <div
                    className={`w-40 h-28 rounded-lg bg-gradient-to-br ${getGradient(item.id)} flex items-center justify-center text-white/80 text-2xl font-serif font-bold flex-shrink-0`}
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
                      {item.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="tag-blue !text-[10px] !px-1.5 !py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="card-static p-4 sticky top-36">
            <h3 className="font-serif font-semibold text-warm-800 mb-3">政务公示</h3>
            <div className="space-y-3">
              {govNews.map((item) => (
                <div key={item.id} className="border-b border-warm-100 pb-3 last:border-0">
                  <p className="text-sm text-warm-700 line-clamp-2">{item.title}</p>
                  <span className="text-xs text-warm-400">{item.date}</span>
                </div>
              ))}
              {govNews.length === 0 && <p className="text-sm text-warm-400">暂无政务公示</p>}
            </div>
          </div>
        </aside>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold">爆料投稿</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-warm-400 hover:text-warm-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="标题"
              className="input-field mb-3"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="内容"
              rows={4}
              className="input-field mb-3 resize-none"
            />
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="标签（逗号分隔）"
              className="input-field mb-4"
            />
            <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> 提交
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
