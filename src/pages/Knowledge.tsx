import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BookOpen,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  PenSquare,
  TrendingUp,
  Shield,
  Lightbulb,
} from "lucide-react"
import { knowledgeArticles } from "@/data/mockData"

const CATEGORIES = [
  { key: "", label: "全部" },
  { key: "transfer_tips", label: "转让心得" },
  { key: "location_skills", label: "选址技巧" },
  { key: "avoid_pitfalls", label: "避坑指南" },
] as const

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

const CATEGORY_ICON: Record<string, React.ElementType> = {
  transfer_tips: TrendingUp,
  location_skills: Lightbulb,
  avoid_pitfalls: Shield,
}

export default function Knowledge() {
  const [activeCategory, setActiveCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = knowledgeArticles.filter((a) => {
    if (activeCategory && a.category !== activeCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-7 h-7 text-navy-900" />
            <h1 className="text-2xl font-bold text-navy-900">经营经验知识库</h1>
          </div>
          <p className="text-sm text-slate-500 mb-5">汇聚转让心得、选址技巧与避坑经验，助你经营少走弯路</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索文章标题或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent transition-all"
              />
            </div>
            <Link
              to="/knowledge/publish"
              className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 shrink-0"
            >
              <PenSquare className="w-4 h-4" />
              发布文章
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.key
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-navy-300 hover:text-navy-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((article, index) => {
              const Icon = CATEGORY_ICON[article.category]
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <Link to={`/knowledge/${article.id}`} className="card overflow-hidden group block">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.coverUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${CATEGORY_BADGE[article.category]}`}
                      >
                        <Icon className="w-3 h-3" />
                        {CATEGORY_LABEL[article.category]}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif font-bold text-navy-900 text-lg mb-2 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-700 font-medium">{article.author}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              article.authorRole === "broker"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-navy-50 text-navy-600"
                            }`}
                          >
                            {article.authorRole === "broker" ? "经纪人" : "商户"}
                          </span>
                          <span className="text-xs text-slate-400">{article.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1 text-xs">
                            <Heart className="w-3.5 h-3.5" />
                            {article.likes}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Bookmark className="w-3.5 h-3.5" />
                            {article.bookmarks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">暂无相关文章</p>
            <p className="text-slate-400 text-sm mt-1">请尝试调整搜索或分类条件</p>
          </div>
        )}
      </div>
    </div>
  )
}
