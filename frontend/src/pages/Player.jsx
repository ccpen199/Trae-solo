import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Row, Col, Slider, Button, Avatar, message, Spin, Empty } from 'antd'
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaHeart } from 'react-icons/fa'
import { contentAPI } from '@/api'
import { useUserStore } from '@/store'

function Player() {
  const { id } = useParams()
  const { currentAlbum, currentEpisode, isPlaying, setPlaying } = useUserStore()
  const [episode, setEpisode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    if (currentEpisode && currentEpisode.id == id) {
      setEpisode(currentEpisode)
      setLoading(false)
    } else {
      loadEpisode()
    }
  }, [id])

  const loadEpisode = async () => {
    try {
      setLoading(true)
      const data = await contentAPI.getEpisode(id)
      setEpisode(data)
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  if (!episode) {
    return <Empty description="音频不存在" />
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <img
            src={episode.cover || currentAlbum?.cover}
            alt={episode.title}
            style={{
              width: 300,
              height: 300,
              borderRadius: 16,
              objectFit: 'cover',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{episode.title}</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>{currentAlbum?.title || episode.author_name}</p>

        <audio
          ref={audioRef}
          src={episode.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          autoPlay={isPlaying}
        />

        <div style={{ marginBottom: 24 }}>
          <Slider
            value={progress}
            onChange={setProgress}
            style={{ marginBottom: 8 }}
            tooltip={{ formatter: value => formatTime((value / 100) * duration) }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
            <span>{formatTime((progress / 100) * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginBottom: 24 }}>
          <Button type="text" icon={<FaStepBackward />} size="large" />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={() => {
              if (audioRef.current) {
                if (isPlaying) {
                  audioRef.current.pause()
                } else {
                  audioRef.current.play().catch(() => {})
                }
              }
              setPlaying(!isPlaying)
            }}
            style={{ width: 64, height: 64, fontSize: 24 }}
          />
          <Button type="text" icon={<FaStepForward />} size="large" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button icon={<FaHeart />}>收藏</Button>
          <Button icon={<FaVolumeUp />}>音量</Button>
        </div>
      </Card>
    </div>
  )
}

export default Player
