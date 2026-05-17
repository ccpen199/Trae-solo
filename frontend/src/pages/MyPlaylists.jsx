import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Music, Play, MoreHorizontal, X, ChevronRight, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const MyPlaylists = () => {
  const navigate = useNavigate()
  const { user, playSong, setPlaylist } = useStore()
  const { showToast } = useToast()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const res = await request.get('/playlists/my')
        if (res.success) {
          setPlaylists(res.data?.list || [])
        }
      } catch (err) {
        console.error('Failed to fetch playlists:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlaylists()
  }, [user])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast('请输入歌单名称', 'error')
      return
    }

    setCreating(true)
    try {
      const res = await request.post('/playlists/create', {
        name: newPlaylistName,
        description: newPlaylistDesc,
        is_public: isPublic
      })
      
      if (res.success) {
        setPlaylists([res.data, ...playlists])
        setShowCreateModal(false)
        setNewPlaylistName('')
        setNewPlaylistDesc('')
        showToast('歌单创建成功', 'success')
      }
    } catch (err) {
      showToast('创建失败，请重试', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handlePlayPlaylist = async (playlist) => {
    try {
      const res = await request.get(`/playlists/detail/${playlist.id}`)
      if (res.success && res.data.songs?.length > 0) {
        setPlaylist(res.data.songs)
        playSong(res.data.songs[0])
      } else {
        showToast('歌单中没有歌曲', 'info')
      }
    } catch (err) {
      showToast('加载歌单失败', 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <User className="w-20 h-20 mx-auto mb-6 text-gray-500" />
          <h2 className="text-2xl font-bold mb-2">登录后查看您的歌单</h2>
          <p className="text-gray-400 mb-8">创建专属歌单，收藏喜欢的音乐</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-8"
          >
            立即登录
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的歌单</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 rounded-full hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>创建歌单</span>
          </button>
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl overflow-hidden cursor-pointer group hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <div className="relative aspect-square">
                  <img
                    src={playlist.cover || 'https://picsum.photos/200'}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayPlaylist(playlist)
                    }}
                    className="absolute bottom-3 right-3 p-3 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate mb-1">{playlist.name}</h3>
                  <p className="text-sm text-gray-400">{playlist.song_count || 0} 首歌</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-2">还没有创建任何歌单</p>
            <p className="text-sm text-gray-500 mb-4">创建一个属于自己的歌单吧</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              创建歌单
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 glass-dark rounded-2xl p-6 z-50 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">创建歌单</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">歌单名称</label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="请输入歌单名称"
                    className="w-full px-4 py-3 bg-white/10 rounded-xl border border-white/10 focus:border-primary-500 outline-none transition-colors"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">歌单描述（可选）</label>
                  <textarea
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    placeholder="介绍一下这个歌单"
                    className="w-full px-4 py-3 bg-white/10 rounded-xl border border-white/10 focus:border-primary-500 outline-none transition-colors resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">公开歌单</span>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isPublic ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isPublic ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                <button
                  onClick={handleCreatePlaylist}
                  disabled={creating || !newPlaylistName.trim()}
                  className="w-full py-3 bg-primary-500 rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyPlaylists
