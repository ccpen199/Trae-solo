import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Eye, ArrowLeft, Link as LinkIcon } from 'lucide-react'
import { api } from '@/lib/api'

interface NewsDetail {
  id: number
  title: string
  content: string
  source: string
  author: string
  published_at: string
  view_count: number
  category_id: number
}

interface RelatedItem {
  id: number
  title: string
  published_at: string
}

export default function NewsDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState<NewsDetail | null>(null)
  const [related, setRelated] = useState<RelatedItem[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get<NewsDetail>(`/news/${id}`).then(setArticle).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!article?.category_id) return
    api.get<{ items: RelatedItem[] }>(`/news?category_id=${article.category_id}&pageSize=5`).then((data) => {
      setRelated(data.items.filter((r) => String(r.id) !== id))
    }).catch(() => {})
  }, [article?.category_id, id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!article) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-400 py-20">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回资讯列表
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {article.source && <span>{article.source}</span>}
            {article.author && <span>作者：{article.author}</span>}
            <span>{article.published_at}</span>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{article.view_count}</span>
            </div>
          </div>

          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
            {article.content}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-3">分享至</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                微信
              </button>
              <button className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
                微博
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-8">
            <h3 className="font-bold text-gray-900 mb-4">相关新闻</h3>
            {related.length === 0 ? (
              <p className="text-sm text-gray-400">暂无相关新闻</p>
            ) : (
              <div className="space-y-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <p className="line-clamp-2 mb-1">{item.title}</p>
                    <span className="text-xs text-gray-400">{item.published_at}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
