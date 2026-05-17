import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI, searchAPI } from '../api';
import { useAuthStore, useToastStore } from '../store';
import CommentsPanel from '../components/CommentsPanel';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recommend');
  const [showComments, setShowComments] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [banners, setBanners] = useState([]);
  const [hotSearches, setHotSearches] = useState([]);
  const navigate = useNavigate();
  const isLogin = useAuthStore((state) => state.isLogin);
  const showToast = useToastStore((state) => state.showToast);
  const videoRefs = useRef({});

  useEffect(() => {
    loadVideos();
    loadBanners();
    loadHotSearches();
  }, []);

  const loadHotSearches = async () => {
    try {
      const res = await searchAPI.getHotSearches();
      setHotSearches(res.data.data || []);
    } catch (err) {
      console.error('Load hot searches error:', err);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await videoAPI.getVideos({ page: 1, limit: 10 });
      setVideos(res.data.data?.videos || []);
    } catch (err) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await searchAPI.getBanners();
      setBanners(res.data.data || []);
    } catch (err) {
      console.error('Load banners error:', err);
    }
  };

  const handleLike = async (video) => {
    if (!isLogin) {
      showToast('请先登录');
      navigate('/login');
      return;
    }

    try {
      await videoAPI.likeVideo(video.id);
      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, is_liked: v.is_liked ? 0 : 1, like_count: v.is_liked ? v.like_count - 1 : v.like_count + 1 }
          : v
      ));
    } catch (err) {
      showToast('操作失败');
    }
  };

  const handleOpenComments = (videoId) => {
    if (!isLogin) {
      showToast('请先登录');
      navigate('/login');
      return;
    }
    setSelectedVideoId(videoId);
    setShowComments(true);
  };

  const handleVideoClick = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const formatCount = (count) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    }
    return count?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">
          <span>{error}</span>
          <button onClick={loadVideos}>重试</button>
        </div>
      </div>
    );
  }

  const renderDiscoverContent = () => (
    <div className="discover-content">
      <div className="banner-section">
        <div className="banner-list">
          {banners.map((banner, index) => (
            <div key={banner.id || index} className="banner-item">
              <img src={banner.image_url} alt={banner.title} />
            </div>
          ))}
          {banners.length === 0 && (
            <>
              <div className="banner-item">
                <img src="https://picsum.photos/800/300?random=10" alt="banner1" />
              </div>
              <div className="banner-item">
                <img src="https://picsum.photos/800/300?random=11" alt="banner2" />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="hot-search-section">
        <h3 className="section-title">🔥 热门搜索</h3>
        <div className="hot-tags">
          {hotSearches.map((item, index) => (
            <span 
              key={item.id} 
              className="hot-tag"
              onClick={() => {
                navigate('/search');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('searchKeyword', { detail: item.keyword }));
                }, 100);
              }}
            >
              {item.keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="hot-videos-section">
        <h3 className="section-title">🎬 热门视频</h3>
        <div className="video-grid">
          {videos.slice(0, 6).map((video) => (
            <div key={video.id} className="video-grid-item">
              <img src={video.cover_url} alt="" />
              <div className="video-grid-info">
                <div className="video-grid-title">{video.title}</div>
                <div className="video-grid-stats">❤️ {formatCount(video.like_count)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="top-bar">
        <span 
          className={`top-tab ${activeTab === 'follow' ? 'active' : ''}`}
          onClick={() => setActiveTab('follow')}
        >
          关注
        </span>
        <span 
          className={`top-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          发现
        </span>
        <span 
          className={`top-tab ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          推荐
        </span>
        <span className="search-icon" onClick={() => navigate('/search')}>🔍</span>
      </div>

      {activeTab === 'discover' ? (
        renderDiscoverContent()
      ) : activeTab === 'follow' ? (
        <div className="empty-state">
          <p style={{ fontSize: '16px', color: '#999' }}>暂无关注的创作者</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>去发现更多有趣的创作者吧～</p>
        </div>
      ) : (
        <div className="video-feed">
          {videos.length === 0 ? (
            <div className="empty-state">暂无视频</div>
          ) : (
            videos.map((video) => (
            <div key={video.id} className="video-item">
              <video
                ref={(el) => videoRefs.current[video.id] = el}
                className="video-player"
                src={video.video_url}
                loop
                muted
                playsInline
                onClick={() => handleVideoClick(video.id)}
                poster={video.cover_url}
              />
              
              <div className="video-info">
                <div className="video-author">
                  <span>@{video.nickname || '创作者'}</span>
                  <button 
                    className="follow-btn"
                    onClick={() => {
                      if (!isLogin) {
                        showToast('请先登录');
                        navigate('/login');
                      } else {
                        showToast('关注成功');
                      }
                    }}
                  >关注</button>
                </div>
                <div className="video-desc">{video.title || video.description}</div>
                <div className="video-music">
                  <span>🎵</span>
                  <span>{video.music || '原声音乐'}</span>
                </div>
              </div>

              <div className="side-actions">
                <div className="avatar-circle">
                  <img src={video.cover_url || 'https://picsum.photos/100/100'} alt="" />
                </div>
                
                <div 
                  className={`action-btn ${video.is_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(video)}
                >
                  <span className="action-icon">❤️</span>
                  <span className="action-count">{formatCount(video.like_count)}</span>
                </div>
                
                <div className="action-btn" onClick={() => handleOpenComments(video.id)}>
                  <span className="action-icon">💬</span>
                  <span className="action-count">{formatCount(video.comment_count)}</span>
                </div>
                
                <div className="action-btn">
                  <span className="action-icon">↗️</span>
                  <span className="action-count">{formatCount(video.share_count)}</span>
                </div>
                
                <div className="music-disc">
                  <img src={video.cover_url || 'https://picsum.photos/50/50'} alt="" />
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {showComments && (
        <CommentsPanel 
          videoId={selectedVideoId} 
          onClose={() => setShowComments(false)} 
        />
      )}
    </div>
  );
};

export default Home;
