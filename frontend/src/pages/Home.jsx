import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';

const Home = () => {
  const [activeTab, setActiveTab] = useState('recommend');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const tabs = [
    { id: 'recommend', label: '推荐' },
    { id: 'hot', label: '热门' },
    { id: 'anime', label: '番剧' },
    { id: 'movie', label: '影视' },
  ];

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [activeTab]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await request.get('/videos/list', {
        params: { type: activeTab, pageSize: 20 }
      });
      setVideos(res.data?.list || []);
    } catch (error) {
      console.error('获取视频列表失败:', error);
      setVideos(getMockVideos());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await request.get('/videos/categories');
      setCategories(res.data || []);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const getMockVideos = () => {
    const mockData = [];
    const titles = [
      '【4K】绝美风景合集，治愈你的心灵',
      '编程入门教程，从零开始学前端',
      '美食探店：这家店的拉面太绝了',
      '游戏实况：挑战最高难度BOSS',
      '音乐MV精选，戴上耳机享受吧',
      'VLOG：我的一天生活记录',
      '科技评测：最新旗舰手机对比',
      '健身教程：30天塑形计划',
      '动漫解说：经典番剧回顾',
      '数码开箱：期待已久的产品终于到了',
      '旅行日记：日本东京七日游',
      '手工制作：教你做可爱的小物件'
    ];
    
    for (let i = 0; i < 12; i++) {
      mockData.push({
        id: i + 1,
        bvid: `BV${Math.random().toString(36).substr(2, 10)}`,
        title: titles[i % titles.length],
        cover: `https://picsum.photos/320/180?random=${i}`,
        duration: `${Math.floor(Math.random() * 20) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        view_count: Math.floor(Math.random() * 1000000),
        like_count: Math.floor(Math.random() * 100000),
        danmaku_count: Math.floor(Math.random() * 5000),
        author_name: `UP主${i + 1}号`,
        author_avatar: `https://i.pravatar.cc/40?img=${i + 1}`,
        category_name: ['动画', '游戏', '音乐', '生活'][i % 4],
        is_vip: i % 8 === 0
      });
    }
    return mockData;
  };

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--primary-color)' : 'white',
              color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {tab.label}
          </button>
        ))}
        {categories.slice(0, 4).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: activeTab === cat.id ? 'var(--primary-color)' : 'white',
              color: activeTab === cat.id ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {videos.map(video => (
              <Link
                key={video.bvid}
                to={`/video/${video.bvid}`}
                className="card"
                style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={video.cover}
                    alt={video.title}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {formatDuration(video.duration)}
                  </span>
                  {video.is_vip && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'linear-gradient(135deg, #fb7299, #ff9c6a)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      大会员
                    </span>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <h3 className="text-ellipsis-2" style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {video.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img
                      src={video.author_avatar}
                      alt={video.author_name}
                      className="avatar"
                      style={{ width: '28px', height: '28px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {video.author_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>👁 {formatCount(video.view_count)}</span>
                    <span>💬 {formatCount(video.danmaku_count)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {videos.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
              <p>暂无视频内容</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
