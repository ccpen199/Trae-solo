import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, formatDate, getStatusBadgeClass, getStatusText } from '../api';
import type { Booking } from '../api';

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Booking[]>('/api/bookings')
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>预约管理</h1>
          <p>共 {bookings.length} 条预约记录</p>
        </div>
        <div className="page-actions">
          <Link to="/booking" className="btn btn-primary">+ 新建预约</Link>
        </div>
      </div>

      <div className="card">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>暂无预约记录</p>
            <Link to="/booking" className="btn btn-primary" style={{ marginTop: 12 }}>
              创建第一个预约
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>客户</th>
                <th>拍摄类型</th>
                <th>摄影师</th>
                <th>日期</th>
                <th>地点</th>
                <th>预算</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.client_name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                      {b.client_phone}
                    </div>
                  </td>
                  <td>{b.shoot_type}</td>
                  <td>{b.photographer_name || '-'}</td>
                  <td>
                    {formatDate(b.shoot_date)}
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                      {b.shoot_time}
                    </div>
                  </td>
                  <td>{b.location || '-'}</td>
                  <td>¥{b.budget?.toLocaleString() || 0}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                      {getStatusText(b.status)}
                    </span>
                  </td>
                  <td>
                    {b.status === 'pending' || b.status === 'confirmed' ? (
                      <Link to={`/orders?booking_id=${b.id}`} className="btn btn-sm btn-primary">
                        创建订单
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="action-row">
        <Link to="/" className="btn btn-secondary">返回首页</Link>
      </div>
    </>
  );
}
