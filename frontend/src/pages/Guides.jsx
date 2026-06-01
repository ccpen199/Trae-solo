import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guideAPI } from '../api';

function Guides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const res = await guideAPI.getGuides();
      setGuides(res.data.list || []);
    } catch (err) {
      console.error('加载攻略失败', err);
    }
  };

  return (
    <div className="guides-page">
      <div className="container">
        <h1 className="page-title">旅行攻略</h1>

        <div className="filter-bar">
          {['全部', '东京', '曼谷', '大理', '厦门', '丽江'].map((item, index) => (
            <div key={index} className="filter-item">
              {item}
            </div>
          ))}
        </div>

        <div className="guides-grid">
          {guides.map((guide) => (
            <div key={guide.id} className="guide-card" onClick={() => navigate(`/guides/${guide.id}`)}>
              <div className="guide-cover">
                <img src={`https://picsum.photos/600/400?random=${guide.id + 10}`} alt={guide.title} />
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
      </div>
    </div>
  );
}

export default Guides;
