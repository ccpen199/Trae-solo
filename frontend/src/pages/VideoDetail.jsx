import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mockVideos = {
      1: { 
        id: 1, 
        title: '人工智能入门教程', 
        author: '科技达人', 
        views: '12.5万', 
        description: '从零开始学习人工智能，包含机器学习、深度学习等核心概念讲解，适合AI入门初学者。'
      },
      2: { 
        id: 2, 
        title: 'React实战开发', 
        author: '前端老司机', 
        views: '8.2万', 
        description: 'React从基础到进阶实战课程，涵盖Hooks、状态管理、性能优化等核心知识点。'
      },
      3: { 
        id: 3, 
        title: '产品设计思维', 
        author: '设计总监', 
        views: '5.1万', 
        description: '产品设计方法论，用户体验设计原则，从需求分析到产品上线全流程讲解。'
      },
      4: { 
        id: 4, 
        title: '投资理财基础', 
        author: '理财专家', 
        views: '20.3万', 
        description: '投资理财入门必修课，涵盖基金、股票、资产配置等核心理财知识。'
      },
      5: { 
        id: 5, 
        title: '职场沟通技巧', 
        author: 'HRD', 
        views: '15.8万', 
        description: '职场高效沟通技巧，向上汇报、跨部门协作、团队沟通等实战经验分享。'
      },
      6: { 
        id: 6, 
        title: '心理学入门', 
        author: '心理咨询师', 
        views: '7.6万', 
        description: '心理学基础概念与实用技巧，认知心理学、社会心理学等领域入门。'
      },
    };
    setVideo(mockVideos[id]);
  }, [id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const updateTime = () => setCurrentTime(videoElement.currentTime);
      const updateDuration = () => {
        setDuration(videoElement.duration);
        setIsLoaded(true);
      };
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      videoElement.addEventListener('timeupdate', updateTime);
      videoElement.addEventListener('loadedmetadata', updateDuration);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);

      return () => {
        videoElement.removeEventListener('timeupdate', updateTime);
        videoElement.removeEventListener('loadedmetadata', updateDuration);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
      };
    }
  }, [video]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(() => {});
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoElement.currentTime = percent * videoElement.duration;
    }
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen().catch(() => {});
      }
    }
  };

  if (!video) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>视频播放</div>
        <div style={{ width: 40 }}></div>
      </header>

      <main>
        <div 
          style={{ 
            width: '100%', 
            background: '#000',
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={togglePlay}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
              display: 'block'
            }}
            poster={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23667eea' width='800' height='450'/%3E%3Ctext x='400' y='225' text-anchor='middle' fill='white' font-size='24'%3E${video.title}%3C/text%3E%3C/svg%3E`}
          >
            <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
            您的浏览器不支持视频播放
          </video>

          {!isPlaying && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.6)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 32,
              pointerEvents: 'none'
            }}>
              ▶
            </div>
          )}

          {(showControls || !isPlaying) && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '20px 16px',
              pointerEvents: 'none'
            }}>
              <div 
                style={{
                  width: '100%',
                  height: 4,
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  marginBottom: 12,
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                onClick={handleProgressClick}
              >
                <div style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  height: '100%',
                  background: '#0066ff',
                  borderRadius: 2,
                  transition: 'width 0.1s',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    right: -6,
                    top: -4,
                    width: 12,
                    height: 12,
                    background: '#0066ff',
                    borderRadius: '50%'
                  }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', pointerEvents: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span style={{ fontSize: 14 }}>
                    {formatTime(currentTime)} / {isLoaded ? formatTime(duration) : '--:--'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 18, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <span onClick={() => videoRef.current.muted = !videoRef.current.muted}>🔊</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      value={volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                      }}
                      style={{ width: 60 }}
                    />
                  </div>
                  <span onClick={toggleFullscreen} style={{ cursor: 'pointer' }}>⛶</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="content">
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{video.title}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {video.author} · {video.views}次播放
          </div>

          <p style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {video.description}
          </p>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>视频简介</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: '50%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold'
              }}>
                {video.author[0]}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{video.author}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>认证创作者</div>
              </div>
              <button style={{
                marginLeft: 'auto',
                padding: '8px 20px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer'
              }}>
                + 关注
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoDetail;
