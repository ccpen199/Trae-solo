import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, TrendingUp, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const Home = () => {
  const navigate = useNavigate()
  const { playSong, setPlaylist } = useStore()
  const { showToast } = useToast()
  const [songs, setSongs] = useState([])
  const [hotKeywords, setHotKeywords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, keywordsRes] = await Promise.all([
          request.get('/songs/recommend?pageSize=20'),
          request.get('/search/hot-keywords')
        ])
        
        if (songsRes.success) {
          setSongs(songsRes.data?.list || [])
        }
        if (keywordsRes.success) {
          setHotKeywords(keywordsRes.data?.slice(0, 10) || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        showToast('加载失败，请刷新重试', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showToast])

  const handlePlay = (song) => {
    playSong(song)
    setPlaylist(songs)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">今日推荐</h2>
          <p className="text-gray-400">根据您的喜好精心挑选</p>
        </div>
        <button 
          onClick={() => navigate('/search')}
          className="p-3 glass rounded-full hover:bg-white/20 transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="w-5 h-5 text-primary-400" />
        <h3 className="font-semibold">热门搜索</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {hotKeywords.map((item, index) => (
          <button
            key={item.id || index}
            onClick={() => navigate(`/search?keyword=${encodeURIComponent(item.keyword)}`)}
            className="px-4 py-2 glass rounded-full text-sm hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
          >
            {item.keyword}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">推荐歌单</h3>
        <button className="text-sm text-primary-400">播放全部</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {songs.slice(0, 10).map((song) => (
          <motion.div
            key={song.id}
            whileHover={{ y: -4 }}
            className="group cursor-pointer"
            onClick={() => handlePlay(song)}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
              <img
                src={song.cover || 'https://picsum.photos/200'}
                alt={song.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
            </div>
            <h4 className="font-medium truncate">{song.name}</h4>
            <p className="text-sm text-gray-400 truncate">{song.artist_name}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="font-semibold text-lg mt-8">全部歌曲</h3>
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
            <span className="w-8 text-center text-gray-500 text-sm">{index + 1}</span>
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
    </div>
  )
}

export default Home