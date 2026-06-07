import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Clock, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface TopicOption {
  id: number
  content: string
  vote_count: number
}

interface Topic {
  id: number
  title: string
  description: string
  status: string
  participant_count: number
  max_select: number
  start_time: string
  end_time: string
  options: TopicOption[]
  total_votes: number
  has_voted: boolean
}

export default function TopicDetail() {
  const { id } = useParams()
  const { isLoggedIn } = useAuthStore()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get<Topic>(`/topics/${id}`)
      .then(setTopic)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const toggleOption = (optionId: number) => {
    if (!topic) return
    setSelectedIds(prev => {
      if (prev.includes(optionId)) return prev.filter(i => i !== optionId)
      if (prev.length >= topic.max_select) return prev
      return [...prev, optionId]
    })
  }

  const handleSubmit = async () => {
    if (!id || selectedIds.length === 0) return
    setSubmitting(true)
    try {
      await api.post(`/topics/${id}/vote`, { option_ids: selectedIds })
      const updated = await api.get<Topic>(`/topics/${id}`)
      setTopic(updated)
      setSelectedIds([])
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  const getVotePercent = (option: TopicOption) => {
    if (!topic || topic.total_votes === 0) return 0
    return Math.round((option.vote_count / topic.total_votes) * 100)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">
        <p>话题不存在</p>
      </div>
    )
  }

  const showResults = topic.has_voted

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-gray-500 mt-2">{topic.description}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {topic.participant_count} 人参与
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(topic.start_time)} ~ {formatDate(topic.end_time)}
          </span>
        </div>
      </div>

      {!isLoggedIn && !showResults && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-amber-700">请先登录后投票</p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm mt-1 inline-block">去登录</Link>
        </div>
      )}

      <div className="space-y-3">
        {topic.options.map(option => {
          const percent = getVotePercent(option)
          const isSelected = selectedIds.includes(option.id)

          if (showResults) {
            return (
              <div key={option.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-900 font-medium">{option.content}</span>
                  <span className="text-sm text-gray-500">{option.vote_count} 票 ({percent}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          }

          return (
            <button
              key={option.id}
              onClick={() => isLoggedIn && toggleOption(option.id)}
              disabled={!isLoggedIn}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-100 bg-white hover:border-blue-200'
              } ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="text-gray-900">{option.content}</span>
              </div>
            </button>
          )
        })}
      </div>

      {!showResults && isLoggedIn && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            已选 {selectedIds.length}/{topic.max_select} 项
          </p>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '投票'}
          </button>
        </div>
      )}

      {showResults && (
        <div className="mt-6 text-center text-sm text-gray-400">
          <CheckCircle className="w-5 h-5 inline-block mr-1 text-green-500" />
          你已参与投票
        </div>
      )}
    </div>
  )
}
