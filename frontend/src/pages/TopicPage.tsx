import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, FileText, Loader2, CheckCircle, Clock, XCircle, AlertTriangle, Bot, Crown, Shield, BarChart3, Eye } from 'lucide-react'
import api from '../utils/api'
import { isAuthenticated, isAdmin } from '../utils/auth'
import ContentCard, { ContentItem } from '../components/ContentCard'
import dayjs from 'dayjs'

const creatorLevels: Record<number, { name: string; color: string; bg: string }> = {
  0: { name: '新手创作者', color: 'text-gray-600', bg: 'bg-gray-100' },
  1: { name: '活跃创作者', color: 'text-green-600', bg: 'bg-green-100' },
  2: { name: '优质创作者', color: 'text-blue-600', bg: 'bg-blue-100' },
  3: { name: '精品创作者', color: 'text-purple-600', bg: 'bg-purple-100' },
  4: { name: '顶级创作者', color: 'text-amber-600', bg: 'bg-amber-100' },
}

interface ReviewLog {
  id: number
  content_id: number
  content_title: string
  reviewer: string
  action: string
  comment?: string
  created_at: string
}

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<any>(null)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([])
  const [showReviewLogs, setShowReviewLogs] = useState(false)
  const isCurrentAdmin = isAdmin()

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await api.get(`/api/topics/${slug}`)
        if (res.data.code === 0) {
          setTopic(res.data.data)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    const fetchContents = async () => {
      try {
        const res = await api.get(`/api/topics/${slug}/contents`)
        if (res.data.code === 0) {
          setContents(res.data.data.list || [])
        }
      } catch {}
    }
    fetchTopic()
    fetchContents()
  }, [slug])

  const handleFollow = async () => {
    if (!isAuthenticated()) return
    try {
      const res = await api.post(`/api/topics/${topic.id}/follow`)
      if (res.data.code === 0) {
        const followed = res.data.data.followed
        setIsFollowing(followed)
        setTopic((prev: any) => ({
          ...prev,
          follower_count: prev.follower_count + (followed ? 1 : -1),
        }))
      }
    } catch {}
  }

  const handleShowReviewLogs = async () => {
    if (!isCurrentAdmin) return
    try {
      const res = await api.get(`/api/topics/${topic.id}/review-logs`)
      if (res.data.code === 0) {
        setReviewLogs(res.data.data || [])
        setShowReviewLogs(true)
      }
    } catch {}
  }

  const getAIReviewSummary = () => {
    const aiApproved = contents.filter((c: ContentItem) => c.review_status === 'ai_approved').length
    const rejected = contents.filter((c: ContentItem) => c.review_status === 'rejected').length
    const approved = contents.filter((c: ContentItem) => c.review_status === 'approved').length
    const pending = contents.filter((c: ContentItem) => c.review_status === 'pending').length
    return { aiApproved, rejected, approved, pending }
  }

  const getSensitiveWordInfo = () => {
    return contents.filter((c: ContentItem) => c.has_sensitive_words === 1).length
  }

  const getCreatorLevelDistribution = () => {
    const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
    contents.forEach((c: ContentItem) => {
      const level = c.author_level || 0
      distribution[level] = (distribution[level] || 0) + 1
    })
    return distribution
  }

  const getTopicStatus = () => {
    if (topic?.is_official === 1) return { label: '官方', color: 'bg-blue-100 text-blue-600', icon: CheckCircle }
    if ((topic?.post_count || 0) === 0) return { label: '策划中', color: 'bg-gray-100 text-gray-500', icon: Clock }
    return { label: '活跃', color: 'bg-green-100 text-green-600', icon: CheckCircle }
  }

  const aiReviewSummary = getAIReviewSummary()
  const sensitiveCount = getSensitiveWordInfo()
  const creatorDistribution = getCreatorLevelDistribution()
  const topicStatus = getTopicStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!topic) {
    return <div className="text-center py-16 text-gray-400">话题不存在</div>
  }

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">#{topic.name}</h1>
              <span className={`badge ${topicStatus.color} text-xs flex items-center gap-0.5`}>
                <topicStatus.icon className="w-3 h-3" />
                {topicStatus.label}
              </span>
            </div>
            {topic.description && <p className="text-gray-600 text-sm mb-3">{topic.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{topic.follower_count || 0} 关注</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{topic.post_count || 0} 篇内容</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated() && (
              <button onClick={handleFollow} className={isFollowing ? 'btn-secondary' : 'btn-primary'}>
                {isFollowing ? '已关注' : '关注话题'}
              </button>
            )}
            {isCurrentAdmin && (
              <button onClick={handleShowReviewLogs} className="btn-secondary flex items-center gap-1">
                <Eye className="w-4 h-4" />审核留痕
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">AI 通过</span>
            </div>
            <div className="text-xl font-bold text-blue-700">{aiReviewSummary.aiApproved}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">人工审核</span>
            </div>
            <div className="text-xl font-bold text-green-700">{aiReviewSummary.approved}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-600">待审核</span>
            </div>
            <div className="text-xl font-bold text-yellow-700">{aiReviewSummary.pending}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">已拒绝</span>
            </div>
            <div className="text-xl font-bold text-red-700">{aiReviewSummary.rejected}</div>
          </div>
        </div>

        {sensitiveCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">检测到 <strong>{sensitiveCount}</strong> 篇内容包含敏感词，需要人工复核</span>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">创作者等级分布</span>
          </div>
          <div className="space-y-2">
            {Object.entries(creatorLevels).map(([level, info]) => {
              const count = creatorDistribution[Number(level)] || 0
              const total = contents.length || 1
              const percentage = Math.round((count / total) * 100)
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className={`text-xs ${info.color} w-20`}>{info.name}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.bg.replace('bg-', 'bg-').replace('100', '500')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{count} 人</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showReviewLogs && isCurrentAdmin && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              审核留痕
            </h3>
            <button onClick={() => setShowReviewLogs(false)} className="text-sm text-gray-500 hover:text-gray-700">
              收起
            </button>
          </div>
          {reviewLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">暂无审核记录</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reviewLogs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{log.content_title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.action === 'approve' ? 'bg-green-100 text-green-600' :
                      log.action === 'reject' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {log.action === 'approve' ? '通过' : log.action === 'reject' ? '拒绝' : log.action}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>审核人：{log.reviewer}</span>
                    <span className="mx-2">·</span>
                    <span>{dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                  {log.comment && (
                    <div className="text-xs text-gray-600 mt-1 pt-1 border-t border-gray-200">
                      审核意见：{log.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {contents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">该话题暂无内容</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map(content => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  )
}
