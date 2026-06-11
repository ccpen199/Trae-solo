import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Clubs() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClub, setNewClub] = useState({ name: '', description: '' })

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      const res = await api.get('/social/clubs')
      setClubs(res.data.clubs || [])
    } catch (err) {
      console.error('Failed to load clubs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (clubId) => {
    try {
      await api.post(`/social/clubs/${clubId}/join`)
      loadClubs()
      alert('加入成功！')
    } catch (err) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/social/clubs', newClub)
      setShowCreateModal(false)
      setNewClub({ name: '', description: '' })
      loadClubs()
      alert('创建成功！')
    } catch (err) {
      alert(err.response?.data?.error || '创建失败')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">俱乐部</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 创建俱乐部
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <div key={club.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-5xl">🏆</span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-800">{club.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{club.description}</p>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span>👥</span>
                  <span className="ml-1">{club.member_count} 成员</span>
                </div>
                <div className="text-xs text-gray-400">
                  会长: {club.owner_name}
                </div>
              </div>

              {club.is_member ? (
                <button className="mt-4 w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  已加入
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(club.id)}
                  className="mt-4 w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                >
                  立即加入
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">创建俱乐部</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  俱乐部名称
                </label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  俱乐部介绍
                </label>
                <textarea
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none h-24 resize-none"
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
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
