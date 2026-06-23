import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import type { KnowledgeDoc } from '../types'
import { knowledgeApi } from '../api'
import { formatDate } from '../utils/format'

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<KnowledgeDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadDoc(parseInt(id))
    }
  }, [id])

  const loadDoc = async (docId: number) => {
    setLoading(true)
    try {
      const data = await knowledgeApi.getDoc(docId)
      setDoc(data)
    } catch (e) {
      console.error('Failed to load doc:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <p>文章不存在</p>
          <button
            onClick={() => navigate('/knowledge')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回知识库
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={() => navigate('/knowledge')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center space-x-1"
          >
            <span>←</span>
            <span>返回列表</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-blue-500">
              {doc.category}
            </span>
            <span>📅 {formatDate(doc.created_at)}</span>
            <span>📖 约 {doc.content.length} 字</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {doc.tags.map(tag => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6">
          {doc.summary && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">摘要：</span>
                {doc.summary}
              </p>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700">
                    {children}
                  </li>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-gray-600 font-medium border-b border-gray-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-gray-700 border-b border-gray-100">
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 text-gray-600 italic">
                    {children}
                  </blockquote>
                )
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-bold text-amber-900 mb-2">⚠️ 免责声明</h3>
        <p className="text-sm text-amber-800">
          本文内容仅供参考，不构成任何投资建议或法律意见。购房决策请结合自身实际情况，
          必要时咨询专业人士。政策可能随时调整，最新政策请以官方发布为准。
        </p>
      </div>
    </div>
  )
}
