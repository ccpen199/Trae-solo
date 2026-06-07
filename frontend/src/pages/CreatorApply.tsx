import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applyCreator } from '../api/client'

export default function CreatorApply() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      setError('请先阅读并同意创作者协议')
      return
    }
    setError('')
    setLoading(true)
    try {
      await applyCreator({ name, bio })
      navigate('/creators')
    } catch (err: any) {
      setError(err.response?.data?.message || '申请失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="card p-6">
        <div className="text-center mb-6">
          <span className="text-4xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900 mt-3">申请成为创作者</h2>
          <p className="text-sm text-gray-500 mt-1">发布原创内容，获取粉丝和收益</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">创作者名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              placeholder="请输入创作者名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">个人简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
              placeholder="介绍你的创作领域和方向..."
              required
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">
              我已阅读并同意
              <span className="text-primary hover:underline cursor-pointer">《创作者服务协议》</span>
              和
              <span className="text-primary hover:underline cursor-pointer">《内容发布规范》</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full btn-primary py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </form>
      </div>
    </div>
  )
}
