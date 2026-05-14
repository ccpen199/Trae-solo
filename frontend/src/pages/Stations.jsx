import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Stations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/services/stations');
      setStations(res.data.data || []);
    } catch (err) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>线下服务站</h1>
      
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '12px', 
        color: 'white',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>服务说明</h2>
        <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
          我们在校园内设有多个服务站点，由保安人员和学生志愿者共同管理。
          失物招领、临时存放、跑腿对接等服务均可在各站点办理。
        </p>
      </div>

      {stations.length === 0 ? (
        <div className="empty">暂无服务站信息</div>
      ) : (
        <div className="grid grid-2">
          {stations.map(station => (
            <div key={station.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ fontSize: '40px' }}>🏪</div>
                <div>
                  <h3 style={{ fontSize: '18px', color: '#1f2937' }}>{station.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{station.building}</p>
                </div>
              </div>
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#4ecdc4' }}>📍</span> {station.location}
              </div>
              {station.manager && (
                <div style={{ marginBottom: '8px', fontSize: '13px', color: '#6b7280' }}>
                  管理员：{station.manager}
                </div>
              )}
              {station.contact && (
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  联系方式：{station.contact}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
