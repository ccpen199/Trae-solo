import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  ThumbsUp,
} from "lucide-react"
import { knowledgeArticles } from "@/data/mockData"

const CATEGORY_BADGE: Record<string, string> = {
  transfer_tips: "bg-amber-100 text-amber-700",
  location_skills: "bg-jade-100 text-jade-700",
  avoid_pitfalls: "bg-coral-100 text-coral-700",
}

const CATEGORY_LABEL: Record<string, string> = {
  transfer_tips: "转让心得",
  location_skills: "选址技巧",
  avoid_pitfalls: "避坑指南",
}

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const article = knowledgeArticles.find((a) => a.id === id)

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-2">未找到该文章</h2>
          <p className="text-slate-500">请检查链接是否正确</p>
        </div>
      </div>
    )
  }

  const relatedArticles = knowledgeArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            to="/knowledge"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回知识库
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${CATEGORY_BADGE[article.category]}`}
            >
              {CATEGORY_LABEL[article.category]}
            </span>
            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{article.author}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  article.authorRole === "broker"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-navy-50 text-navy-600"
                }`}
              >
                {article.authorRole === "broker" ? "经纪人" : "商户"}
              </span>
              <span>{article.createdAt}</span>
            </div>
          </div>

          <div className="card p-8 mb-6">
            <div
              className="prose prose-slate max-w-none prose-headings:text-navy-900 prose-headings:font-serif prose-strong:text-navy-800 prose-li:marker:text-amber-500 prose-a:text-amber-600"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="card p-5 flex items-center justify-between mb-10"
          >
            <div className="flex items-center gap-5">
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-coral-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span>{article.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-500 transition-colors">
                <Bookmark className="w-5 h-5" />
                <span>{article.bookmarks}</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-600 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>分享</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-jade-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>{article.comments}</span>
              </button>
            </div>
            <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-500 transition-colors">
              <ThumbsUp className="w-5 h-5" />
              <span>有用</span>
            </button>
          </motion.div>

          {relatedArticles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h2 className="section-title text-lg mb-5">相关推荐</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/knowledge/${related.id}`}
                    className="card overflow-hidden group block"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={related.coverUrl}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-navy-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {related.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">{related.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{related.author}</span>
                        <span>·</span>
                        <span>{related.createdAt}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {related.likes}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
