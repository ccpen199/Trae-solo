import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  KnowledgeDoc,
  KnowledgeCategory,
  KnowledgeTag
} from '../types'
import { knowledgeApi } from '../api'
import { formatDate } from '../utils/format'

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  const [tags, setTags] = useState<KnowledgeTag[]>([])
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
    loadTags()
  }, [])

  useEffect(() => {
    loadDocs()
  }, [page, selectedCategory, selectedTag, searchKeyword])

  const loadCategories = async () => {
    try {
      const data = await knowledgeApi.getCategories()
      setCategories(data)
    } catch (e) {
      console.error('Failed to load categories:', e)
    }
  }

  const loadTags = async () => {
    try {
      const data = await knowledgeApi.getTags()
      setTags(data)
    } catch (e) {
      console.error('Failed to load tags:', e)
    }
  }

  const loadDocs = async () => {
    setLoading(true)
    try {
      const data = await knowledgeApi.getDocs({
        page,
        pageSize,
        category: selectedCategory || undefined,
        tagId: selectedTag || undefined,
        keyword: searchKeyword || undefined
      })
      setDocs(data.items)
      setTotal(data.total)
    } catch (e) {
      console.error('Failed to load docs:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getCategoryColor = (catId: string) => {
    const cat = categories.find(c => c.id === catId)
    return cat?.color || '#3b82f6'
  }

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId)
    return cat?.name || catId
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">购房知识库</h2>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="搜索购房知识、流程、税费、贷款..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </form>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">按分类浏览</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory(null); setPage(1) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : undefined
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">按标签筛选</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedTag(null); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedTag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部标签
            </button>
            {tags.filter(t => t.docCount && t.docCount > 0).map(tag => (
              <button
                key={tag.id}
                onClick={() => { setSelectedTag(tag.id); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === tag.id
                    ? 'text-white'
                    : 'text-gray-600 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedTag === tag.id ? tag.color : `${tag.color}20`,
                  color: selectedTag === tag.id ? 'white' : tag.color
                }}
              >
                {tag.name} ({tag.docCount})
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共找到 <span className="font-medium text-gray-700">{total}</span> 篇文章
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无相关文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => navigate(`/knowledge/${doc.id}`)}
                className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {doc.title}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0 ml-3"
                    style={{ backgroundColor: getCategoryColor(doc.category) }}
                  >
                    {getCategoryName(doc.category)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {doc.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
