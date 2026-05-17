import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { videoAPI } from '../services/api';

const NearbyPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('北京');

  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, [city]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getNearby({ city, limit: 20 });
      const videoData = response.data?.data?.list || [];

      if (videoData.length === 0) {
        setVideos([]);
      } else {
        setVideos(videoData);
      }
    } catch (error) {
      console.error('Load nearby videos error:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

  return (
    <div style={{ minHeight: '100%', background: '#000', paddingBottom: '80px' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#000',
        zIndex: 100,
        padding: '50px 20px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              style={{
                padding: '8px 16px',
                background: city === c ? '#fe2c55' : '#1a1a1a',
                border: 'none',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '100px 20px', textAlign: 'center', color: '#fff' }}>
          加载中...
        </div>
      ) : videos.length === 0 ? (
        <div style={{ padding: '100px 20px', textAlign: 'center', color: '#999' }}>
          当前城市暂无视频
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2px',
          padding: '0 2px'
        }}>
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => navigate(`/video/${video.id}`)}
              style={{
                position: 'relative',
                aspectRatio: '3/4',
                cursor: 'pointer'
              }}
            >
              <img
                src={video.cover_url || video.cover || `https://picsum.photos/300/400?random=${video.id}`}
                alt={video.title || video.description || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
              }}>
                <div style={{ color: '#fff', fontSize: '12px', marginBottom: '4px' }}>
                  @{video.nickname || '用户'}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#fff' }}>
                  <span>❤️ {video.like_count || 0}</span>
                  <span>💬 {video.comment_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default NearbyPage;
