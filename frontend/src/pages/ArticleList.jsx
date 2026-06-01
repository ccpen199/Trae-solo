import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { homeApi } from '../api'

export default function ArticleList() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setLoading(true)
    try {
      const res = await homeApi.getArticles({ limit: 20 })
      setArticles(res.data.data.list)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 sticky top-0 z-10">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索资讯..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无资讯</div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/articles/${article.id}`)}
              className="flex bg-white rounded-lg overflow-hidden shadow-sm p-3"
            >
              <div className="flex-1">
                <h3 className="font-medium text-sm line-clamp-2">{article.title}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {article.content?.slice(0, 100)}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <span>{article.category}</span>
                  <span className="mx-2">·</span>
                  <span>{article.view_count}阅读</span>
                </div>
              </div>
              {article.cover && (
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-lg ml-3"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
