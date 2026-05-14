import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Video = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recommend');

  const videos = [
    { id: 1, title: '人工智能入门教程', author: '科技达人', views: '12.5万', duration: '15:30', category: 'recommend' },
    { id: 2, title: 'React实战开发', author: '前端老司机', views: '8.2万', duration: '23:45', category: 'recommend' },
    { id: 3, title: '产品设计思维', author: '设计总监', views: '5.1万', duration: '18:20', category: 'recommend' },
    { id: 4, title: '投资理财基础', author: '理财专家', views: '20.3万', duration: '12:10', category: 'recommend' },
    { id: 5, title: '职场沟通技巧', author: 'HRD', views: '15.8万', duration: '20:15', category: 'recommend' },
    { id: 6, title: '心理学入门', author: '心理咨询师', views: '7.6万', duration: '16:40', category: 'recommend' },
  ];

  const theaterVideos = [
    { id: 101, title: '经典电影解说合集', author: '影评人小王', views: '56.2万', duration: '12:30' },
    { id: 102, title: '悬疑电影深度解析', author: '电影侦探', views: '34.8万', duration: '18:45' },
    { id: 103, title: '科幻电影发展史', author: '科幻迷', views: '28.6万', duration: '25:10' },
    { id: 104, title: '动画电影精选', author: '动画达人', views: '42.3万', duration: '16:55' },
  ];

  const saltVideos = [
    { id: 201, title: '海盐创作营：视频剪辑入门', author: '专业剪辑师', views: '8.9万', duration: '32:20', price: '¥49' },
    { id: 202, title: '海盐创作营：运营涨粉技巧', author: '运营专家', views: '6.7万', duration: '28:15', price: '¥69' },
    { id: 203, title: '海盐创作营：拍摄与布光', author: '摄影师老张', views: '5.2万', duration: '45:30', price: '¥59' },
    { id: 204, title: '海盐创作营：脚本创作指南', author: '编剧小李', views: '4.8万', duration: '38:50', price: '¥39' },
  ];

  const getCurrentVideos = () => {
    switch (activeTab) {
      case 'theater': return theaterVideos;
      case 'salt': return saltVideos;
      default: return videos;
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo">视频</div>
        <nav className="nav-tabs">
          <span 
            className={`nav-tab ${activeTab === 'recommend' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommend')}
            style={{ cursor: 'pointer' }}
          >
            推荐
          </span>
          <span 
            className={`nav-tab ${activeTab === 'theater' ? 'active' : ''}`}
            onClick={() => setActiveTab('theater')}
            style={{ cursor: 'pointer' }}
          >
            放映厅
          </span>
          <span 
            className={`nav-tab ${activeTab === 'salt' ? 'active' : ''}`}
            onClick={() => setActiveTab('salt')}
            style={{ cursor: 'pointer' }}
          >
            海盐计划
          </span>
        </nav>
      </header>

      <main className="content" style={{ paddingBottom: '80px' }}>
        {activeTab === 'salt' && (
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            color: 'white'
          }}>
            <h3 style={{ marginBottom: '8px' }}>🌊 海盐创作者计划</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>加入计划，学习专业创作技能，成为优质内容创作者</p>
          </div>
        )}

        <div className="video-grid">
          {getCurrentVideos().map((video) => (
            <div 
              key={video.id} 
              className="video-card"
              onClick={() => navigate(`/video/${video.id > 100 ? 1 : video.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="video-cover" style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  bottom: '8px', 
                  right: '8px', 
                  background: 'rgba(0,0,0,0.7)', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px'
                }}>
                  {video.duration}
                </span>
                {video.price && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#ff4757',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {video.price}
                  </span>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontWeight: 500, marginBottom: '6px', fontSize: '14px' }}>{video.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {video.author} · {video.views}次播放
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Video;
