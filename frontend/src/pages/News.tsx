import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNews } from '../api/client'
import { formatTime, getCredibilityLabel } from '../hooks'

const categories = ['全部', '时政', '社会', '科技', '娱乐', '体育', '财经']
const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'hot', label: '最热' },
  { value: 'near', label: '最近' },
]

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  credibility_score: number
  created_at: string
  category: string
  cover_url?: string
  region_tags?: string[]
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')
  const [sort, setSort] = useState('latest')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const pageSize = 12

  const loadNews = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: pageSize, sort }
      if (category !== '全部') params.category = category
      if (search) params.search = search
      const res = await getNews(params)
      setNews(res.data?.items ?? res.data ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNews() }, [category, sort, page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">资讯中心</h2>
        <button onClick={() => navigate('/creators/apply')} className="btn-primary text-sm">
          ✏️ 发布资讯
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setPage(1) }}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    sort === opt.value ? 'bg-white text-primary font-medium shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadNews()}
                placeholder="搜索资讯..."
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : news.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => {
            const cred = getCredibilityLabel(item.credibility_score)
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}`)}
                className="card overflow-hidden cursor-pointer hover:border-primary/30 group"
              >
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-4xl opacity-50">📰</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{item.source}</span>
                      <span className={`badge ${cred.color}`}>{cred.text}</span>
                    </div>
                    <span className="text-gray-400">{formatTime(item.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.category && (
                      <span className="text-xs text-secondary bg-blue-50 px-2 py-0.5 rounded">{item.category}</span>
                    )}
                    {item.region_tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>暂无资讯</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
