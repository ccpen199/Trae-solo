import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Tag } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const tagOptions = ['全部', '政策解读', '继续教育', '行业动态']

const categoryToTag: Record<string, string> = {
  policy: '政策解读',
  education: '继续教育',
  news: '行业动态',
}

const tagToCategory: Record<string, string> = {
  '政策解读': 'policy',
  '继续教育': 'education',
  '行业动态': 'news',
}

interface PostItem {
  id: string
  title: string
  category: string
  tags: string
  summary: string
  likes: number
  comments: number
  author: string
  date: string
}

export default function Community() {
  const [activeTag, setActiveTag] = useState('全部')
  const [posts, setPosts] = useState<PostItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (activeTag !== '全部' && tagToCategory[activeTag]) {
        params.set('category', tagToCategory[activeTag])
      }
      const res = await apiFetch(`/community/posts?${params.toString()}`)
      if (res.success) {
        setPosts(res.data.items || [])
        setTotal(res.data.total || 0)
        setTotalPages(res.data.totalPages || 0)
      }
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [page, activeTag])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleTagChange = (tag: string) => {
    setActiveTag(tag)
    setPage(1)
  }

  const parseTags = (tagsStr: string): string[] => {
    try {
      const parsed = JSON.parse(tagsStr)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">医疗人社区</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagChange(tag)}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTag === tag ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> #{tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-stone-500 py-12">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {posts.map((post) => {
            const displayTag = categoryToTag[post.category] || post.category
            const postTags = parseTags(post.tags)
            return (
              <Link key={post.id} to={`/community/${post.id}`} className="bg-white border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  displayTag === '政策解读' ? 'bg-amber-50 text-amber-700' :
                  displayTag === '继续教育' ? 'bg-teal-50 text-teal-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  #{displayTag}
                </span>
                <h3 className="font-medium text-lg text-stone-800 mt-3 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-stone-500 mt-2 line-clamp-2">{post.summary}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
                  <span>{post.author} · {post.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-teal-700 text-white' : 'border border-stone-300 hover:bg-stone-50'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
