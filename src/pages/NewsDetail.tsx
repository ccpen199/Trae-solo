import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface NewsDetailData {
  id: number
  title: string
  content: string
  tags: string
  source: string
  created_at: string
}

const TAG_COLORS = ['tag-red', 'tag-blue', 'tag-gold']

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const [news, setNews] = useState<NewsDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/news/${id}`)
      .then((res) => res.json())
      .then((data) => setNews(data.data || null))
      .catch(() => setNews(null))
      .finally(() => setLoading(false))
  }, [id])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const tagList = news?.tags ? news.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回资讯列表
      </Link>

      {loading ? (
        <div className="card-static p-8 animate-pulse">
          <div className="h-8 bg-warm-100 rounded w-3/4 mb-4" />
          <div className="h-4 bg-warm-100 rounded w-1/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-warm-100 rounded w-full" />
            <div className="h-4 bg-warm-100 rounded w-full" />
            <div className="h-4 bg-warm-100 rounded w-5/6" />
          </div>
        </div>
      ) : news ? (
        <article className="card-static p-6 md:p-8">
          <h1 className="section-title text-2xl md:text-3xl mb-4">{news.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-warm-400 mb-6 pb-6 border-b border-warm-100">
            <span>来源：{news.source === 'government' ? '官方发布' : news.source === 'merchant' ? '商家投稿' : '用户投稿'}</span>
            <span>·</span>
            <span>{formatTime(news.created_at)}</span>
          </div>
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tagList.map((tag, idx) => (
                <span key={tag} className={TAG_COLORS[idx % TAG_COLORS.length]}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="prose prose-warm max-w-none text-warm-700 leading-relaxed whitespace-pre-wrap">
            {news.content}
          </div>
        </article>
      ) : (
        <div className="card-static p-8 text-center text-warm-400">
          资讯不存在或已被删除
        </div>
      )}
    </div>
  )
}
