import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Music, Play, User, LogOut, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const MyLikes = () => {
  const navigate = useNavigate()
  const { user, playSong, setPlaylist, logout } = useStore()
  const { showToast } = useToast()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLikes = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const res = await request.get('/songs/my-likes')
        if (res.success) {
          setSongs(res.data?.list || [])
        }
      } catch (err) {
        console.error('Failed to fetch likes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLikes()
  }, [user])

  const handlePlay = (song) => {
    playSong(song)
    setPlaylist(songs)
  }

  const handleLogout = () => {
    logout()
    showToast('已退出登录', 'success')
    navigate('/login')
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
          <h2 className="text-2xl font-bold mb-2">登录后查看您的收藏</h2>
          <p className="text-gray-400 mb-8">收藏喜欢的音乐，随时都能听到</p>
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
      <div className="glass-dark px-4 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-primary-400 text-2xl font-bold">
                  {user.nickname?.charAt(0) || user.phone?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.nickname || '音乐爱好者'}</h2>
                <p className="text-gray-400 text-sm">{user.phone || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 glass rounded-xl">
              <p className="text-2xl font-bold text-primary-400">{songs.length}</p>
              <p className="text-sm text-gray-400">收藏歌曲</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <p className="text-2xl font-bold text-primary-400">0</p>
              <p className="text-sm text-gray-400">创建歌单</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <p className="text-2xl font-bold text-primary-400">0</p>
              <p className="text-sm text-gray-400">关注</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-lg">我喜欢的音乐</h3>
            <span className="text-sm text-gray-400">({songs.length}首)</span>
          </div>
          {songs.length > 0 && (
            <button className="text-sm text-primary-400">播放全部</button>
          )}
        </div>

        {songs.length > 0 ? (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => handlePlay(song)}
              >
                <img
                  src={song.cover || 'https://picsum.photos/200'}
                  alt={song.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary-400 transition-colors">{song.name}</p>
                  <p className="text-sm text-gray-400 truncate">{song.artist_name}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-primary-500 rounded-full">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-2">还没有收藏任何歌曲</p>
            <p className="text-sm text-gray-500">去发现音乐，收藏你喜欢的吧</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn-primary"
            >
              去发现
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyLikes