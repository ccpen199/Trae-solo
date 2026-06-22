import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye } from 'lucide-react'
import { newsArticles } from '@/data'
import type { NewsArticle } from '@/types'

const categories = [
  { key: 'all', label: '全部' },
  { key: 'local', label: '本地新闻' },
  { key: 'policy', label: '政策公告' },
  { key: 'township', label: '乡镇动态' },
  { key: 'guide', label: '生活指南' },
]

function relativeTime(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

export default function News() {
  const [activeTab, setActiveTab] = useState('all')

  const filtered: NewsArticle[] =
    activeTab === 'all'
      ? newsArticles
      : newsArticles.filter((a) => a.category === activeTab)

  const [featured, ...rest] = filtered

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex gap-1 border-b border-rock-100 mb-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === cat.key
                ? 'text-jade-600'
                : 'text-rock-500 hover:text-rock-700'
            }`}
          >
            {cat.label}
            {activeTab === cat.key && (
              <motion.div
                layoutId="news-tab-underline"
                className="absolute bottom-0 inset-x-2 h-0.5 bg-jade-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {featured && (
            <Link
              to={`/news/${featured.id}`}
              className="block mb-6 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[16/9]">
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="font-serif text-xl md:text-2xl text-white font-bold leading-snug mb-2">
                    {featured.title}
                  </h2>
                  <p className="text-white/80 text-sm line-clamp-2 mb-2">
                    {featured.summary}
                  </p>
                  <div className="flex items-center gap-1 text-ember-400 text-sm">
                    <Eye className="w-4 h-4" />
                    <span className="font-mono">{featured.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rest.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/news/${article.id}`}
                  className="flex gap-3 p-3 rounded-lg hover:bg-rock-50 transition-colors group"
                >
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-28 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex flex-col justify-between min-w-0 py-0.5">
                    <h3 className="text-sm font-medium text-rock-900 line-clamp-2 group-hover:text-jade-600 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-rock-400">
                      <span>{relativeTime(article.publishedAt)}</span>
                      <div className="flex items-center gap-0.5 text-ember-400">
                        <Eye className="w-3 h-3" />
                        <span className="font-mono">{article.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-rock-400">
              暂无相关资讯
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
