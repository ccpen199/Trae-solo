import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Play, Pause, SkipBack, SkipForward, Heart, Share2, MessageCircle, 
  Volume2, VolumeX, Repeat, Shuffle, ChevronDown, Disc3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const Player = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { 
    currentSong, isPlaying, togglePlay, playNext, playPrev, 
    setCurrentTime, setDuration, playSong, setPlaylist,
    currentTime, duration
  } = useStore()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await request.get(`/songs/detail/${id}`)
        if (res.success) {
          setSong(res.data)
          setIsLiked(res.data.is_liked || false)
          if (!currentSong || currentSong.id !== res.data.id) {
            playSong(res.data)
          }
        }
      } catch (err) {
        showToast('加载歌曲失败', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchSong()
  }, [id])

  const [isDragging, setIsDragging] = useState(false)

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const audioElement = document.querySelector('audio')
    if (audioElement && audioElement.duration) {
      audioElement.currentTime = percent * audioElement.duration
      setCurrentTime(audioElement.currentTime)
    }
  }

  const handleSeekStart = (e) => {
    setIsDragging(true)
    handleSeek(e)
  }

  const handleSeekMove = (e) => {
    if (isDragging) {
      handleSeek(e)
    }
  }

  const handleSeekEnd = () => {
    setIsDragging(false)
  }

  const handleLike = async () => {
    try {
      await request.post(`/songs/like/${id}`)
      setIsLiked(!isLiked)
      showToast(isLiked ? '已取消收藏' : '已添加到收藏', 'success')
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const parseLyrics = (lyricsStr) => {
    if (!lyricsStr) return []
    const lines = lyricsStr.split('\n')
    const lyrics = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
    
    lines.forEach(line => {
      const match = line.match(timeRegex)
      if (match) {
        const minutes = parseInt(match[1])
        const seconds = parseInt(match[2])
        const milliseconds = parseInt(match[3] || 0)
        const time = minutes * 60 + seconds + milliseconds / 1000
        const text = line.replace(timeRegex, '').trim()
        if (text) {
          lyrics.push({ time, text })
        }
      }
    })
    
    return lyrics
  }

  const lyrics = parseLyrics(song?.lyrics)
  const currentLyricIndex = lyrics.findIndex((l, i) => 
    currentTime >= l.time && (!lyrics[i + 1] || currentTime < lyrics[i + 1].time)
  )

  if (loading) {
    return <Loading />
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">歌曲不存在</p>
      </div>
    )
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${song.cover || 'https://picsum.photos/400'})`,
          filter: 'blur(50px) brightness(0.3)'
        }}
      />
      
      <div className="relative z-10">
        <header className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronDown className="w-6 h-6" />
          </button>
          <h1 className="font-medium truncate max-w-xs">{song.name}</h1>
          <button className="p-2">
            <Share2 className="w-6 h-6" />
          </button>
        </header>

        <div className="px-8 pt-8 pb-4">
          <div 
            className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl mb-8 cursor-pointer"
            onClick={() => setShowLyrics(!showLyrics)}
          >
            <AnimatePresence mode="wait">
              {showLyrics ? (
                <motion.div
                  key="lyrics"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full glass p-6 overflow-y-auto"
                >
                  <div className="space-y-4 text-center">
                    {lyrics.length > 0 ? (
                      lyrics.map((line, index) => (
                        <p 
                          key={index}
                          className={`transition-all duration-300 ${
                            index === currentLyricIndex 
                              ? 'text-primary-400 text-xl font-medium' 
                              : 'text-gray-400 text-base'
                          }`}
                        >
                          {line.text}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-400">暂无歌词</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full relative"
                >
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-full h-full"
                  >
                    <img
                      src={song.cover || 'https://picsum.photos/400'}
                      alt={song.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">{song.name}</h2>
            <p className="text-gray-400">{song.artist_name}</p>
          </div>

          <div className="mb-6">
            <div 
              className="h-2 bg-white/20 rounded-full cursor-pointer relative group"
              onClick={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseMove={handleSeekMove}
              onMouseUp={handleSeekEnd}
              onMouseLeave={handleSeekEnd}
            >
              <motion.div 
                className="absolute inset-y-0 left-0 bg-primary-500 rounded-full"
                style={{ width: `${(currentTime / duration * 100) || 0}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / duration * 100) || 0}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-8">
            <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
              <Shuffle className="w-6 h-6 text-gray-400" />
            </button>
            <button
              onClick={playPrev}
              className="p-3 hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipBack className="w-8 h-8" />
            </button>
            <button
              onClick={togglePlay}
              className="p-5 bg-primary-500 rounded-full hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
            <button
              onClick={playNext}
              className="p-3 hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipForward className="w-8 h-8" />
            </button>
            <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
              <Repeat className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-around">
            <button 
              onClick={handleLike}
              className={`p-3 rounded-full transition-colors ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => navigate(`/comments/${id}`)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
              <Disc3 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Player