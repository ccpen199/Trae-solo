import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function Topics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', content: '', city: '' })

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const res = await api.get('/social/topics')
      setTopics(res.data.topics || [])
    } catch (err) {
      console.error('Failed to load topics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/social/topics', newTopic)
      setShowCreateModal(false)
      setNewTopic({ title: '', content: '', city: '' })
      alert('话题已提交，待审核通过后展示')
      loadTopics()
    } catch (err) {
      alert(err.response?.data?.error || '发布失败')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">话题广场</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 发布话题
        </button>
      </div>

      <div className="space-y-4">
        {topics.length > 0 ? (
          topics.map(topic => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg">
                  {topic.nickname?.[0] || topic.username?.[0] || 'U'}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {topic.nickname || topic.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(topic.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mt-2">{topic.title}</h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{topic.content}</p>
                  
                  <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
                    <span>👁️ {topic.views} 浏览</span>
                    <span>❤️ {topic.likes} 点赞</span>
                    {topic.city && <span>📍 {topic.city}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">💬</div>
            <p>暂无话题，快来发布第一个吧！</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">发布话题</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="分享你的骑行故事..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <textarea
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none h-32 resize-none"
                  placeholder="分享你的骑行心得、装备评测、路线推荐..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所在城市
                </label>
                <input
                  type="text"
                  value={newTopic.city}
                  onChange={(e) => setNewTopic({ ...newTopic, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="如：北京"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
