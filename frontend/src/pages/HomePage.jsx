import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import BottomNav from '../components/BottomNav';
import { videoAPI } from '../services/api';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoAPI.getRecommend({ limit: 10 });
      const videoData = response.data?.data?.list || [];
      setVideos(videoData);
    } catch (err) {
      setError('加载视频失败，请重试');
      console.error('Load videos error:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - startYRef.current;

    if (Math.abs(diffY) > 100) {
      if (diffY > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (diffY < 0 && currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  };

  const handleSwipeLeft = () => {
    if (videos[currentIndex]?.user_id) {
      navigate(`/user/${videos[currentIndex].user_id}`);
    }
  };

  const handleSwipeRight = () => {
    navigate('/nearby');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#000'
      }}>
        <div style={{ color: '#fff' }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#000',
        padding: '20px'
      }}>
        <p style={{ color: '#fff', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={loadVideos}
          style={{
            padding: '10px 20px',
            background: '#fe2c55',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#000'
      }}>
        <p style={{ color: '#999' }}>暂无视频</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: '#000', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          transform: `translateY(-${currentIndex * 100}%)`,
          transition: 'transform 0.3s ease-out',
          height: `${videos.length * 100}%`
        }}>
          {videos.map((video, index) => (
            <div key={video.id} style={{ height: '100vh' }}>
              <VideoPlayer
                video={video}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '40px 0 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        zIndex: 100,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'
      }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: 'bold', opacity: 1 }}>
          推荐
        </span>
        <span
          onClick={() => navigate('/nearby')}
          style={{ color: '#fff', fontSize: '17px', opacity: 0.6, cursor: 'pointer' }}
        >
          附近
        </span>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
