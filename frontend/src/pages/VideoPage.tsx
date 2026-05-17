import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { videoApi } from '../api/client';
import type { Video } from '../types';
import { Home } from 'lucide-react';

const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await videoApi.getVideos(1, 10);
        if (response.success && response.data) {
          setVideos(response.data.list);
          if (id) {
            const index = response.data.list.findIndex(v => v.id === parseInt(id));
            if (index !== -1) {
              setCurrentIndex(index);
            }
          }
        }
      } catch (err) {
        console.error('加载视频列表失败:', err);
      }
    };
    loadVideos();
  }, [id]);

  const currentVideo = videos[currentIndex];

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="video-page">
      <div className="video-page-container">
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', textDecoration: 'none' }}>
            <Home size={20} />
            返回首页
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          {currentVideo ? (
            <VideoPlayer
              videoId={currentVideo.id}
              onNext={currentIndex < videos.length - 1 ? handleNext : undefined}
              onPrev={currentIndex > 0 ? handlePrev : undefined}
              autoPlay={true}
            />
          ) : (
            <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'white' }}>加载中...</p>
            </div>
          )}
        </div>

        {currentVideo && (
          <div className="video-info-section">
            <h1 className="video-page-title">
              {currentVideo.title}
              {currentVideo.is_vip && (
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.5rem',
                  background: '#fbbf24',
                  color: 'black',
                  fontSize: '0.75rem',
                  borderRadius: '9999px'
                }}>
                  VIP
                </span>
              )}
            </h1>
            <p className="video-page-desc">{currentVideo.description}</p>
          </div>
        )}

        {videos.length > 0 && (
          <div className="related-section">
            <h2 className="related-title">更多视频</h2>
            <div className="related-grid">
              {videos.map((video, index) => (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  onClick={() => setCurrentIndex(index)}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                    border: index === currentIndex ? '2px solid #ef4444' : 'none'
                  }}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {video.is_vip && (
                      <span style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        background: '#fbbf24',
                        color: 'black',
                        fontSize: '0.75rem',
                        borderRadius: '9999px'
                      }}>
                        VIP
                      </span>
                    )}
                  </div>
                  <h3 style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>{video.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
