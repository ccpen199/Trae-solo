import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { eventAPI } from '../api/client';

const categories = [
  { key: 'all', label: '全部' },
  { key: 'concert', label: '演唱会' },
  { key: 'performance', label: '演出' },
  { key: 'exhibition', label: '展览' },
  { key: 'kids', label: '亲子' },
];

const typeLabels = { concert: '演唱会', performance: '演出', exhibition: '展览', kids: '亲子' };

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [activeCategory]);

  const loadData = async () => {
    try {
      const params = activeCategory !== 'all' ? { type: activeCategory, limit: 50 } : { limit: 50 };
      const res = await eventAPI.list(params);
      setSessions(res.data || []);
    } catch (e) {
      console.error('Load data failed:', e);
    }
  };

  const getStatusClass = (status) => {
    const map = { onsale: 'status-onsale', presale: 'status-presale', seckill: 'status-seckill', soldout: 'status-soldout', draft: 'status-soldout' };
    return map[status] || '';
  };

  const getStatusLabel = (status) => {
    const map = { onsale: '售票中', presale: '预售', seckill: '秒杀', soldout: '已售罄', draft: '即将开售' };
    return map[status] || status;
  };

  const getRemaining = (s) => {
    const total = s.total_inventory || 0;
    const sold = s.sold_count || 0;
    return Math.max(0, total - sold);
  };

  return (
    <div>
      <div className="hero">
        <h1>泛文娱票务综合服务平台</h1>
        <p>覆盖电影、演出、展览、亲子等全品类票务，智能选座，极速购票</p>
      </div>

      <section className="ops-panel">
        <div>
          <p className="section-kicker">管理后台</p>
          <h2>运营后台管理</h2>
          <p>集中查看数据概览、订单管理、用户管理、票房运营数据、场馆与场次配置。</p>
        </div>
        <div className="ops-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>
            进入管理后台
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/box-office')}>
            查看运营数据
          </button>
        </div>
      </section>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button key={cat.key} className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => setActiveCategory(cat.key)}>
            {cat.label}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>暂无该品类场次</div>
      ) : (
        <div className="events-grid">
          {sessions.map((s) => (
            <div key={s.session_id} className="event-card" onClick={() => navigate(`/session/${s.session_id}/select-seat`)}>
              <img src={s.poster_url || 'https://picsum.photos/400/300'} alt={s.event_title} className="event-poster" />
              <div className="event-info">
                <h3 className="event-title">{s.event_title}</h3>
                <p className="event-meta">
                  {typeLabels[s.event_type] || s.event_type} · {dayjs(s.start_time).format('MM月DD日 HH:mm')}
                </p>
                <p className="event-meta">
                  📍 {s.venue_name} · {s.city}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: '#667eea', fontWeight: '700', fontSize: '1.1rem' }}>
                    ¥{s.min_price || '---'}{s.max_price && s.max_price !== s.min_price ? ` - ¥${s.max_price}` : ''}
                  </span>
                  <span className={`status-badge ${getStatusClass(s.status)}`}>
                    {s.is_seckill ? '⚡ ' : ''}{getStatusLabel(s.status)}
                  </span>
                </div>
                <p className="event-meta" style={{ marginTop: '0.25rem' }}>
                  余票 {getRemaining(s)} 张 · 已售 {s.sold_count || 0}/{s.total_inventory || 0}
                </p>
                <button className="btn btn-primary" style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/session/${s.session_id}/select-seat`); }}>
                  选座购票
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
