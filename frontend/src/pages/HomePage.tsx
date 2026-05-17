import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi } from '../api/client';
import type { Video } from '../types';
import { Play, Crown, Search } from 'lucide-react';

const HomePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await videoApi.getVideos(1, 20);
        if (response.success && response.data) {
          setVideos(response.data.list);
        }
      } catch (err) {
        console.error('加载视频列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Play size={24} style={{ color: 'white', fill: 'white' }} />
            </div>
            <span className="logo-text">XX视频</span>
          </Link>
          <div className="header-right">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="搜索视频..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <Link to="/admin" className="admin-link">
              管理后台
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="section-title">热门推荐</h2>
          {loading ? (
            <div className="loading-skeleton">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-item">
                  <div className="skeleton-thumbnail" />
                  <div className="skeleton-title" />
                  <div className="skeleton-desc" />
                </div>
              ))}
            </div>
          ) : (
            <div className="video-grid">
              {filteredVideos.map((video) => (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  className="video-card"
                >
                  <div className="video-thumbnail">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                    />
                    <div className="play-overlay">
                      <Play size={48} style={{ color: 'white', fill: 'white' }} />
                    </div>
                    {video.is_vip && (
                      <div className="vip-badge">
                        <Crown size={12} style={{ color: 'black' }} />
                        <span>VIP</span>
                      </div>
                    )}
                  </div>
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {filteredVideos.some(v => v.is_vip) && (
          <section className="promo-banner">
            <div className="promo-content">
              <div>
                <h2 className="promo-title">开通VIP会员</h2>
                <p className="promo-description">畅享全站高清视频，无广告纯净体验</p>
              </div>
              <button className="promo-button">
                立即开通
              </button>
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>© 2024 XX视频. 保留所有权利.</p>
      </footer>
    </div>
  );
};

export default HomePage;
