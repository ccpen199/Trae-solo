import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, formatCurrency, formatDate } from '../api';
import type { Photographer, PortfolioItem, PhotographerPackage, ScheduleEntry } from '../api';

export default function PhotographerDetail() {
  const { id } = useParams<{ id: string }>();
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiGet<Photographer>(`/api/photographers/${id}`)
      .then(setPhotographer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;
  if (!photographer) return null;

  const portfolio: PortfolioItem[] = photographer.portfolio ?? [];
  const packages: PhotographerPackage[] = photographer.packages ?? [];
  const schedules: ScheduleEntry[] = photographer.schedule ?? [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const scheduleMap = new Map<string, ScheduleEntry>();
  for (const s of schedules) {
    if (!s.date.startsWith(monthStr)) continue;
    scheduleMap.set(s.date, s);
  }

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const cells: React.ReactNode[] = [];
  for (let d = 0; d < firstDay; d++) {
    cells.push(<div key={`empty-${d}`} className="day-cell" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const entry = scheduleMap.get(dateStr);
    const cls = entry
      ? entry.status === 'booked'
        ? 'day-cell booked'
        : entry.status === 'available'
          ? 'day-cell available'
          : 'day-cell'
      : 'day-cell';
    cells.push(
      <div key={day} className={cls}>
        <div className="date-num">{day}</div>
        {entry && (
          <div className="slot-info">
            {entry.status === 'available' && <div>可约</div>}
            {entry.status === 'booked' && <div>已约</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="detail-header">
        <div className="avatar">{photographer.name.charAt(0)}</div>
        <div className="info">
          <h1>{photographer.name}</h1>
          <p>{photographer.bio}</p>
          <div className="tags">
            <span className="badge active">{photographer.style}</span>
            <span className="badge warn">{photographer.city}</span>
            <span className="badge ok">评分 {photographer.rating}</span>
          </div>
        </div>
        <Link to={`/booking/${photographer.id}`} className="btn btn-primary btn-lg">
          预约此摄影师
        </Link>
      </div>

      {portfolio.length > 0 && (
        <div className="section">
          <h2 className="section-title">作品集</h2>
          <div className="portfolio-grid">
            {portfolio.map((item: PortfolioItem) => (
              <div className="portfolio-item" key={item.id}>
                <img
                  src={item.image_url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${photographer.style} photography ${item.category} ${item.title}`)}&image_size=landscape_4_3`}
                  alt={item.title}
                  loading="lazy"
                />
                <div className="overlay">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <div className="section">
          <h2 className="section-title">套餐</h2>
          <div className="package-list">
            {packages.map((pkg) => (
              <div className="package-item" key={pkg.id}>
                <div>
                  <div className="name">{pkg.name}</div>
                  <div className="desc">{pkg.description}</div>
                </div>
                <div className="price">{formatCurrency(pkg.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">{year}年{month + 1}月档期</h2>
        <div className="schedule-calendar">
          {dayNames.map((d) => (
            <div className="day-header" key={d}>{d}</div>
          ))}
          {cells}
        </div>
        <div className="action-row" style={{ marginTop: 12 }}>
          <span className="badge ok" style={{ fontSize: 11 }}>空闲</span>
          <span className="badge error" style={{ fontSize: 11 }}>已约</span>
        </div>
      </div>
    </>
  );
}
