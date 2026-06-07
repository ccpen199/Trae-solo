import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVideos } from '../api/client'
import { formatTime, formatNumber } from '../hooks'

const categories = ['全部', '时政', '社会', '科技', '娱乐', '体育', '财经']
const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'popular', label: '最热' },
]

interface VideoItem {
  id: string
  title: string
  duration: number
  view_count: number
  completion_rate: number
  category: string
  created_at: string
  creator?: { name: string }
}

export default function Video() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const loadVideos = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 12, sort }
      if (category !== '全部') params.category = category
      const res = await getVideos(params)
      setVideos(res.data?.items ?? res.data ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVideos() }, [category, sort, page])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">视频中心</h2>
        <button onClick={() => navigate('/creators/apply')} className="btn-primary text-sm">
          📹 上传视频
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
                  category === cat ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 sm:ml-auto">
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/videos/${item.id}`)}
              className="card overflow-hidden cursor-pointer hover:border-primary/30 group"
            >
              <div className="relative h-44 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(item.duration)}
                </span>
                <div className="absolute bottom-2 left-2 right-12 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(item.completion_rate ?? 0) * 100}%` }} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>👁 {formatNumber(item.view_count)}</span>
                    <span>完播率 {((item.completion_rate ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <span>{formatTime(item.created_at)}</span>
                </div>
                {item.creator && (
                  <p className="text-xs text-gray-500 mt-2">by {item.creator.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🎬</p>
          <p>暂无视频</p>
        </div>
      )}

      {total > 12 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
