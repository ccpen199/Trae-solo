import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Clock, Play } from 'lucide-react'
import { api } from '@/lib/api'

interface Quiz {
  id: number
  title: string
  description: string
  participant_count: number
  time_limit: number
  status: string
}

export default function Quizzes() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ list: Quiz[]; total: number }>('/quizzes')
      .then((data) => setQuizzes(data.list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">进行中</span>
    if (status === 'upcoming') return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">即将开始</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">已结束</span>
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">互动答题</h1>
        <p className="text-gray-500 mt-1">知识竞赛，寓教于乐</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3" />
          <p>暂无答题活动</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="h-36 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white/80" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{quiz.title}</h3>
                  {getStatusBadge(quiz.status)}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {quiz.participant_count} 人参与
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.time_limit} 秒/题
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/quizzes/${quiz.id}/play`)}
                  disabled={quiz.status === 'ended'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  开始答题
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
