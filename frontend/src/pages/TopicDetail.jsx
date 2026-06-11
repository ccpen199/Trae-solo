import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

export default function TopicDetail() {
  const { id } = useParams()
  const [topic, setTopic] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    loadTopic()
  }, [id])

  const loadTopic = async () => {
    try {
      const res = await api.get(`/social/topics/${id}`)
      setTopic(res.data.topic)
      setComments(res.data.comments || [])
    } catch (err) {
      console.error('Failed to load topic:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await api.post(`/social/topics/${id}/comments`, { content: commentText })
      setCommentText('')
      loadTopic()
    } catch (err) {
      alert(err.response?.data?.error || '评论失败')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  if (!topic) {
    return <div className="text-center py-20 text-gray-500">话题不存在</div>
  }

  return (
    <div className="space-y-6">
      <Link to="/topics" className="text-gray-500 hover:text-gray-700 inline-flex items-center">
        ← 返回话题列表
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
            {topic.nickname?.[0] || topic.username?.[0] || 'U'}
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-800">
              {topic.nickname || topic.username}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(topic.created_at).toLocaleString('zh-CN')}
              {topic.city && ` · ${topic.city}`}
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-4">{topic.title}</h1>
        <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>

        <div className="flex items-center mt-6 pt-4 border-t border-gray-100 space-x-6 text-sm text-gray-500">
          <span>👁️ {topic.views} 浏览</span>
          <span>❤️ {topic.likes} 点赞</span>
          <span>💬 {comments.length} 评论</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          评论 ({comments.length})
        </h3>

        <form onSubmit={handleComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm">
              我
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none h-20 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  发送评论
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                  {comment.nickname?.[0] || comment.username?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800 text-sm">
                      {comment.nickname || comment.username}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无评论，来抢沙发吧～
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
