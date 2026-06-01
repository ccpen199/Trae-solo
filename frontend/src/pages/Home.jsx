import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guideAPI, destinationAPI } from '../api';

const quickNavs = [
  { icon: '📝', name: '攻略', path: '/guides' },
  { icon: '🏨', name: '酒店', path: '/hotels' },
  { icon: '✈️', name: '机票', path: '/flights' },
  { icon: '🛒', name: '商城', path: '/guides' },
  { icon: '📖', name: '游记', path: '/guides' },
  { icon: '🎬', name: '视频', path: '/guides' },
  { icon: '❓', name: '问答', path: '/guides' },
  { icon: '👤', name: '我的', path: '/profile' },
];

function Home() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [guidesRes, destRes] = await Promise.all([
        guideAPI.getGuides({ limit: 6 }),
        destinationAPI.getDestinations()
      ]);
      setGuides(guidesRes.data.list || []);
      setDestinations(destRes.data.slice(0, 8));
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  return (
    <div className="home">
      <section className="banner">
        <div className="banner-content">
          <h1 className="banner-title">发现世界的美好</h1>
          <p className="banner-subtitle">百万旅行攻略，带你探索每一个角落</p>
          <div className="search-box">
            <input type="text" placeholder="搜索目的地、攻略、酒店..." />
            <button>搜索</button>
          </div>
        </div>
      </section>

      <section className="quick-nav container">
        <h2 className="section-title">快捷导航</h2>
        <div className="nav-grid">
          {quickNavs.map((item, index) => (
            <div key={index} className="nav-item" onClick={() => navigate(item.path)}>
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-name">{item.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="destinations">
        <div className="container">
          <h2 className="section-title">热门目的地</h2>
          <div className="dest-grid">
            {destinations.map((dest, index) => (
              <div key={index} className="dest-card" onClick={() => navigate('/guides')}>
                <img src={`https://picsum.photos/400/300?random=${index + 100}`} alt={dest.name} />
                <div className="dest-name">{dest.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="guides-section container">
        <h2 className="section-title">精选攻略</h2>
        <div className="guides-grid">
          {guides.map((guide) => (
            <div key={guide.id} className="guide-card" onClick={() => navigate(`/guides/${guide.id}`)}>
              <div className="guide-cover">
                <img src={`https://picsum.photos/600/400?random=${guide.id}`} alt={guide.title} />
                <div className="guide-meta">
                  <span className="meta-tag">{guide.destination || '热门'}</span>
                </div>
              </div>
              <div className="guide-content">
                <h3 className="guide-title">{guide.title}</h3>
                <div className="guide-info">
                  <div className="guide-author">
                    <img src={`https://picsum.photos/100/100?random=${guide.user_id}`} alt="" />
                    <span>{guide.nickname || '旅行者'}</span>
                  </div>
                  <div className="guide-stats">
                    <span className="stat">👁️ {guide.views || 0}</span>
                    <span className="stat">❤️ {guide.likes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
