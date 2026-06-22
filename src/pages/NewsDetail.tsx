import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, User, Calendar } from 'lucide-react'
import { newsArticles } from '@/data'

const categoryLabels: Record<string, string> = {
  local: '本地新闻',
  policy: '政策公告',
  township: '乡镇动态',
  guide: '生活指南',
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const article = newsArticles.find((a) => a.id === id)

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif font-bold text-rock-900 mb-4">
          资讯未找到
        </h1>
        <p className="text-rock-400 mb-6">该资讯可能已被删除或链接有误</p>
        <button
          onClick={() => navigate(-1)}
          className="text-jade-600 hover:text-jade-700 font-medium"
        >
          返回上一页
        </button>
      </div>
    )
  }

  const related = newsArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-4 py-6"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-rock-500 hover:text-jade-600 transition-colors mb-5 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <img
        src={article.coverImage}
        alt={article.title}
        className="w-full aspect-video object-cover rounded-xl mb-5"
      />

      <div className="mb-3">
        <span className="inline-block bg-jade-50 text-jade-600 text-xs font-medium px-2.5 py-1 rounded-full">
          {categoryLabels[article.category] || article.category}
        </span>
      </div>

      <h1 className="font-serif text-2xl font-bold text-rock-900 leading-snug mb-4">
        {article.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-rock-400 mb-6 pb-6 border-b border-rock-100">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          <span>{article.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(article.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-ember-400">
          <Eye className="w-3.5 h-3.5" />
          <span className="font-mono">{article.views.toLocaleString()}</span>
        </div>
      </div>

      <div className="font-body text-rock-800 leading-relaxed text-[15px] whitespace-pre-wrap mb-10">
        {article.content}
      </div>

      {related.length > 0 && (
        <div className="border-t border-rock-100 pt-6">
          <h3 className="font-serif font-bold text-lg text-rock-900 mb-4">
            相关资讯
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/news/${r.id}`}
                className="group rounded-lg overflow-hidden border border-rock-100 hover:border-jade-200 transition-colors"
              >
                <img
                  src={r.coverImage}
                  alt={r.title}
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-3">
                  <h4 className="text-sm font-medium text-rock-800 line-clamp-2 group-hover:text-jade-600 transition-colors">
                    {r.title}
                  </h4>
                  <div className="flex items-center gap-0.5 mt-1.5 text-xs text-ember-400">
                    <Eye className="w-3 h-3" />
                    <span className="font-mono">{r.views.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
