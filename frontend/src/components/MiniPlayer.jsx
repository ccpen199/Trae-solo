import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Slider, Button, Avatar } from 'antd'
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaExpand, FaHeart, FaTimes } from 'react-icons/fa'
import { useUserStore } from '@/store'

function MiniPlayer() {
  const navigate = useNavigate()
  const { currentEpisode, currentAlbum, isPlaying, setPlaying, setProgress, playProgress } = useUserStore()
  const audioRef = useRef(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (audioRef.current && currentEpisode) {
      audioRef.current.src = currentEpisode.audio_url
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [currentEpisode])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress || 0)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSliderChange = (value) => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (value / 100) * duration
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentEpisode) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.98) 100%',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 999,
      borderTop: '1px solid #e8e8e8'
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => navigate(`/player/${currentEpisode.id}`)}>
        <Avatar src={currentEpisode.cover || currentAlbum?.cover} size={56} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{currentEpisode.title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{currentAlbum?.title || currentEpisode.author_name}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8 }}>
          <Button type="text" icon={<FaStepBackward />} size="small" />
          <Button
            type="primary"
            shape="circle"
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={(e) => { e.stopPropagation(); setPlaying(!isPlaying) }}
            size="large"
            style={{ width: 44, height: 44 }}
          />
          <Button type="text" icon={<FaStepForward />} size="small" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <span style={{ fontSize: 12, color: '#999', width: 40, textAlign: 'right' }}>
            {formatTime((playProgress / 100) * duration || 0)}
          </span>
          <Slider
            value={playProgress}
            onChange={handleSliderChange}
            style={{ flex: 1 }}
            tooltip={{ formatter: null }}
          />
          <span style={{ fontSize: 12, color: '#999', width: 40 }}>{formatTime(duration)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button type="text" icon={<FaHeart />} />
        <Button type="text" icon={<FaExpand />} onClick={() => navigate(`/player/${currentEpisode.id}`)} />
      </div>
    </div>
  )
}

export default MiniPlayer
