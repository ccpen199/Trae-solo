import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, formatCurrency } from '../api';
import type { Photographer } from '../api';

export default function PhotographerList() {
  const navigate = useNavigate();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Photographer[]>('/api/photographers')
      .then(setPhotographers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>摄影师</h1>
          <p>共 {photographers.length} 位摄影师</p>
        </div>
      </div>

      <div className="card-grid">
        {photographers.map((p) => (
          <div className="photographer-card" key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar">{p.name.charAt(0)}</div>
              <div className="info">
                <h3>{p.name}</h3>
                <p>{p.style} · {p.city} · 评分 {p.rating}</p>
              </div>
            </div>
            <div className="stats">
              <span>预约 <strong>{p.booking_count ?? 0}</strong></span>
              <span>产值 <strong>{formatCurrency(p.booking_value ?? 0)}</strong></span>
            </div>
            <div className="actions">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/photographers/${p.id}`)}>
                查看详情
              </button>
              <Link to={`/booking/${p.id}`} className="btn btn-primary btn-sm">
                立即预约
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
