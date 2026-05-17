import { useState, useEffect } from 'react';
import { Play, Users } from 'lucide-react';
import { liveAPI } from '../utils/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function LivePage() {
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLives();
  }, []);

  const loadLives = async () => {
    try {
      const res = await liveAPI.getList();
      if (res.success) {
        setLives(res.data.list || []);
      }
    } catch (err) {
      console.error('Load lives error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading) return <Loading />;

  return (
    <div className="page-container" style={{ background: '#000', padding: '60px 16px 80px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: '600' }}>直播</h2>
      
      {lives.length === 0 ? (
        <EmptyState message="暂无直播" />
      ) : (
        <div className="live-grid">
          {lives.map(live => (
            <div key={live.id} className="live-card">
              <img 
                className="live-cover" 
                src={live.cover_url || `https://picsum.photos/400/300?random=${live.id}`} 
                alt="" 
              />
              <div className="live-tag">
                <Play size={12} /> 直播中
              </div>
              <div className="live-viewers">
                <Users size={12} />
                <span>{formatCount(live.viewers_count)}</span>
              </div>
              <div className="live-anchor">
                <img 
                  className="live-anchor-avatar" 
                  src={live.anchor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${live.user_id}`} 
                  alt="" 
                />
                <span className="live-anchor-name">{live.anchor_name || '主播'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
