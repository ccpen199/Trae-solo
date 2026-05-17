import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, Heart, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import request from '../utils/request'
import { useToast } from './Toast'

const MiniPlayer = () => {
  const navigate = useNavigate()
  const { currentSong, isPlaying, togglePlay, playNext, playPrev, setCurrentTime, setDuration } = useStore()
  const audioRef = useRef(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSong])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!currentSong) return
    
    try {
      await request.post(`/songs/like/${currentSong.id}`)
      showToast(currentSong.is_liked ? '已取消收藏' : '已添加到收藏', 'success')
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleSeek = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = percent * audioRef.current.duration
    }
  }

  if (!currentSong) return null

  const state = useStore.getState()
  const progress = (state.currentTime / state.duration * 100) || 0

  return (
    <div 
      className="fixed bottom-16 left-0 right-0 glass-dark z-30 cursor-pointer"
      onClick={() => navigate(`/player/${currentSong.id}`)}
    >
      <div 
        className="h-1 bg-gray-700 cursor-pointer group"
        onClick={handleSeek}
      >
        <motion.div 
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-4 p-3 max-w-6xl mx-auto">
        <motion.img
          src={currentSong.cover || 'https://picsum.photos/200'}
          alt={currentSong.name}
          className="w-12 h-12 rounded-lg object-cover shadow-lg"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{currentSong.name}</p>
          <p className="text-sm text-gray-400 truncate">{currentSong.artist_name || '未知艺术家'}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); playPrev() }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            className="p-3 bg-primary-500 rounded-full hover:bg-primary-600 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); playNext() }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-colors ${
              currentSong.is_liked ? 'text-red-500' : 'hover:bg-white/10'}`}
          >
            <Heart className="w-5 h-5" fill={currentSong.is_liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
      />
    </div>
  )
}

export default MiniPlayer