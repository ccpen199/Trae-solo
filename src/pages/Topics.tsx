import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Users, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'

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
  options: TopicOption[]
  total_votes: number
}

export default function Topics() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ list: Topic[]; total: number }>('/topics?status=active')
      .then((data) => setTopics(data.list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getVotePercent = (option: TopicOption, total: number) => {
    if (total === 0) return 0
    return Math.round((option.vote_count / total) * 100)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">进行中</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">已结束</span>
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">话题投票</h1>
        <p className="text-gray-500 mt-1">参与投票，表达你的观点</p>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" />
          <p>暂无进行中的话题</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map(topic => (
            <div
              key={topic.id}
              onClick={() => navigate(`/topics/${topic.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{topic.title}</h3>
                {getStatusBadge(topic.status)}
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{topic.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {topic.participant_count} 人参与
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {topic.options.length} 个选项
                </span>
              </div>
              <div className="space-y-2">
                {topic.options.slice(0, 3).map(option => (
                  <div key={option.id}>
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                      <span>{option.content}</span>
                      <span>{getVotePercent(option, topic.total_votes)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${getVotePercent(option, topic.total_votes)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {topic.options.length > 3 && (
                  <p className="text-xs text-gray-400">还有 {topic.options.length - 3} 个选项...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/topics?status=closed')}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
        >
          查看更多
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
