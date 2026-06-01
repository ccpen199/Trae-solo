import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Image } from 'lucide-react'
import { communityApi } from '../api'
import { useAuthStore } from '../store'

export default function CreatePost() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('strategy')
  const [loading, setLoading] = useState(false)

  const categories = [
    { value: 'strategy', label: '旅游攻略' },
    { value: 'qa', label: '问答求助' },
    { value: 'share', label: '分享交流' },
  ]

  const handleSubmit = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!title.trim()) {
      alert('请输入标题')
      return
    }
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setLoading(true)
    try {
      await communityApi.createPost({
        title,
        content,
        category,
      })
      alert('发布成功！')
      navigate('/community')
    } catch (error) {
      alert(error.response?.data?.error || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">发布帖子</h1>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="ml-auto bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm disabled:bg-gray-300"
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <div className="mb-4">
          <label className="text-sm text-gray-500 mb-2 block">选择分类</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  category === cat.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-500 mb-2 block">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题"
            className="w-full border rounded-lg p-3 outline-none text-sm focus:border-red-500"
            maxLength={50}
          />
          <p className="text-right text-xs text-gray-400 mt-1">{title.length}/50</p>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-2 block">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的旅行经历或问题..."
            rows={10}
            className="w-full border rounded-lg p-3 outline-none text-sm focus:border-red-500 resize-none"
          />
        </div>

        <button className="mt-4 flex items-center text-gray-500 text-sm">
          <Image className="w-5 h-5 mr-2" />
          添加图片
        </button>
      </div>
    </div>
  )
}
