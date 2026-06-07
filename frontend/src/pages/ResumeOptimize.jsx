import React, { useState } from 'react'
import { DocumentTextIcon, SparklesIcon, TagIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { aiAPI } from '../api/client'

const ResumeOptimize = () => {
  const [content, setContent] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await aiAPI.analyzeResume(content)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || '分析失败')
    } finally {
      setLoading(false)
    }
  }

  const scoreCategories = result?.scores
    ? [
        { label: '内容完整度', value: result.scores.completeness || 0 },
        { label: '关键词匹配', value: result.scores.keywordMatch || 0 },
        { label: '格式规范', value: result.scores.formatting || 0 },
        { label: '技能展示', value: result.scores.skills || 0 },
        { label: '经历描述', value: result.scores.experience || 0 },
      ]
    : []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">简历优化</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">粘贴简历内容</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请将简历内容粘贴到此处..."
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className="mt-3 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          {loading ? '分析中...' : 'AI分析'}
        </button>
      </div>

      {result && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
              综合评分
            </h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-indigo-600">{result.overallScore || result.score || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {scoreCategories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.label}</span>
                    <span className="text-gray-800 font-medium">{cat.value}分</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${cat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.keywords && result.keywords.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-indigo-500" />
                关键词
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                  >
                    {typeof kw === 'string' ? kw : kw.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                优化建议
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{typeof s === 'string' ? s : s.content || s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResumeOptimize
