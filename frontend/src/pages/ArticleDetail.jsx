import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, MessageCircle } from 'lucide-react'
import { homeApi } from '../api'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)

  useEffect(() => {
    loadArticle()
  }, [id])

  const loadArticle = async () => {
    try {
      const res = await homeApi.getArticleDetail(id)
      setArticle(res.data.data)
    } catch (error) {
      console.error('加载失败', error)
    }
  }

  if (!article) {
    return <div className="p-4 text-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10 p-4 flex items-center border-b">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium flex-1 truncate">资讯详情</h1>
        <button className="ml-2">
          <Share2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4">
        <h1 className="text-xl font-bold">{article.title}</h1>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <span>{article.author || '澳门旅行'}</span>
          <span className="mx-2">·</span>
          <span>{article.category}</span>
          <span className="mx-2">·</span>
          <span>{article.view_count}阅读</span>
        </div>

        {article.cover && (
          <img
            src={article.cover}
            alt={article.title}
            className="w-full h-48 object-cover rounded-lg mt-4"
          />
        )}

        <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          <button className="flex items-center text-gray-500">
            <Heart className="w-5 h-5 mr-1" />
            <span className="text-sm">{article.like_count || 0}</span>
          </button>
          <button className="flex items-center text-gray-500">
            <MessageCircle className="w-5 h-5 mr-1" />
            <span className="text-sm">评论</span>
          </button>
        </div>
      </div>
    </div>
  )
}
