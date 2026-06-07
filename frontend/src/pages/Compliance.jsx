import React, { useState, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon,
  ScaleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import { complianceAPI } from '../api/client'

const categories = [
  { value: '', label: '全部' },
  { value: 'labor', label: '劳动法' },
  { value: 'social_security', label: '社会保险' },
  { value: 'contract', label: '合同法' },
  { value: 'tax', label: '税法' },
  { value: 'corporate', label: '公司法' },
]

const Compliance = () => {
  const [keyword, setKeyword] = useState('')
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [lawyerQuestion, setLawyerQuestion] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSearch = async () => {
    if (!keyword.trim()) return
    setSearchLoading(true)
    setError('')
    try {
      const res = await complianceAPI.searchLaw(keyword)
      setArticles(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || '搜索失败')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCategoryChange = async (cat) => {
    setCategory(cat)
    if (cat) {
      setSearchLoading(true)
      try {
        const res = await complianceAPI.getArticles(cat)
        setArticles(res.data || [])
      } catch (err) {
        setError('获取文章失败')
      } finally {
        setSearchLoading(false)
      }
    }
  }

  const handleAskLawyer = async () => {
    if (!lawyerQuestion.trim()) return
    const q = lawyerQuestion.trim()
    setLawyerQuestion('')
    setChatMessages((prev) => [...prev, { role: 'user', content: q }])
    setChatLoading(true)
    try {
      const res = await complianceAPI.askLawyer(q)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.answer || res.data.message || res.data },
      ])
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，获取回答失败，请稍后重试。' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskLawyer()
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">合规咨询</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">法律分类</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-indigo-500" />
          法条搜索
        </h3>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入关键词搜索法律条文..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            {searchLoading ? '搜索中...' : '搜索'}
          </button>
        </div>

        {articles.length > 0 && (
          <div className="mt-4 space-y-3">
            {articles.map((article, idx) => (
              <div key={article.id || idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpenIcon className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-gray-800">{article.title || article.name}</span>
                </div>
                <p className="text-sm text-gray-600">{article.content || article.summary}</p>
                {article.category && (
                  <span className="inline-block mt-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                    {article.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ScaleIcon className="w-5 h-5 text-indigo-500" />
          AI律师咨询
        </h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatMessages.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">向AI律师提问，获取专业法律建议</p>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 px-4 py-2.5 rounded-lg border border-gray-200 text-sm">
                  正在思考...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={lawyerQuestion}
              onChange={(e) => setLawyerQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的法律问题..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-50 text-sm"
            />
            <button
              onClick={handleAskLawyer}
              disabled={chatLoading || !lawyerQuestion.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Compliance
