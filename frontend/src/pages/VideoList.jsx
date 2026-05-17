import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../api';
import { useToast } from '../components/Toast';

const VideoList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setLoading(true);
      
      const res = await videoAPI.getList({ page: pageNum, pageSize: 10 });
      const newVideos = res.data?.list || [];
      
      if (isRefresh) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }
      
      const total = res.data?.pagination?.total || 0;
      setHasMore(newVideos.length === 10 && (pageNum * 10 < total));
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVideos(1, true);
  }, [fetchVideos]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, false);
    }
  };

  const handleVideoClick = (id) => {
    navigate(`/video/${id}`);
  };

  const formatCount = (count) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count?.toString() || '0';
  };

  if (loading && videos.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎬</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>📡</div>
        <div style={{ color: '#999', marginBottom: '20px' }}>{error}</div>
        <button
          onClick={() => fetchVideos(1, true)}
          style={{
            padding: '10px 24px',
            background: '#fe2c55',
            border: 'none',
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🎥</div>
        <div style={{ color: '#999' }}>暂无视频，敬请期待</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #222' }}>
        <h1 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>快视频</h1>
        <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0 0' }}>发现精彩原创内容</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a' }}
            >
              <div style={{ position: 'relative', width: '100%', paddingTop: '177%' }}>
                <img
                  src={video.cover_url}
                  alt={video.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {Math.floor((video.duration || 0) / 60)}:{String((video.duration || 0) % 60).padStart(2, '0')}
                </div>
              </div>
              <div style={{ padding: '8px' }}>
                <h3 style={{ color: '#fff', fontSize: '13px', margin: '0 0 6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {video.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={video.avatar}
                    alt=""
                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                  />
                  <span style={{ color: '#999', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {video.username}
                  </span>
                  <span style={{ color: '#fe2c55', fontSize: '11px' }}>❤ {formatCount(video.like_count)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: '#333',
                border: 'none',
                borderRadius: '20px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #222', background: '#000' }}>
        {[
          { icon: '🏠', label: '首页', active: true },
          { icon: '🔍', label: '发现', active: false },
          { icon: '➕', label: '发布', active: false },
          { icon: '💬', label: '消息', active: false },
          { icon: '👤', label: '我的', active: false }
        ].map((item, index) => (
          <div key={index} style={{ textAlign: 'center', padding: '6px 12px' }}>
            <div style={{ fontSize: '20px' }}>{item.icon}</div>
            <div style={{ fontSize: '11px', color: item.active ? '#fe2c55' : '#999', marginTop: '4px' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;
