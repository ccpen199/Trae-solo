import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, formatCurrency, formatDate, getStatusBadgeClass, getStatusText } from '../api';
import type { Summary, Photographer, Order, Delivery, Booking } from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet<Summary>('/api/reports/summary'),
      apiGet<Photographer[]>('/api/photographers'),
      apiGet<Order[]>('/api/orders'),
      apiGet<Delivery[]>('/api/deliveries'),
      apiGet<Booking[]>('/api/bookings'),
    ])
      .then(([sum, ph, orders, deliveries, bookings]) => {
        setSummary(sum);
        setPhotographers(ph.slice(0, 3));
        setRecentOrders(orders.slice(0, 4));
        setPendingDeliveries(deliveries.filter((d) => d.status !== '已完成').slice(0, 4));
        setPendingBookings(bookings.filter((b) => b.status === 'pending').slice(0, 4));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;
  if (!summary) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>运营总览</h1>
          <p>统一查看预约、订单、摄影师档期和成片交付进度</p>
        </div>
        <div className="page-actions">
          <Link to="/booking" className="btn btn-primary">+ 新建预约</Link>
        </div>
      </div>

      <div className="metrics">
        <Link to="/bookings" className="metric-card metric-clickable">
          <span>预约数</span>
          <strong>{summary.bookingCount}</strong>
          <small>待确认 {pendingBookings.length} 单</small>
        </Link>
        <Link to="/orders" className="metric-card metric-clickable">
          <span>合同额</span>
          <strong>{formatCurrency(summary.revenue)}</strong>
        </Link>
        <Link to="/orders" className="metric-card metric-clickable">
          <span>已收款</span>
          <strong>{formatCurrency(summary.paid)}</strong>
          <small style={{ color: 'var(--warning)' }}>待收 {formatCurrency(summary.outstanding)}</small>
        </Link>
        <Link to="/deliveries" className="metric-card metric-clickable">
          <span>交付中</span>
          <strong>{summary.openDeliveries}</strong>
          <small>已完成 {pendingDeliveries.filter((d) => d.progress === 100).length}</small>
        </Link>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>近期拍摄</h2>
            <Link to="/bookings" className="btn btn-sm btn-secondary">全部预约</Link>
          </div>
          {summary.nextBookings.length === 0 ? (
            <div className="empty-state"><p>暂无预约</p></div>
          ) : (
            summary.nextBookings.slice(0, 4).map((b, idx) => (
              <Link to="/bookings" className="booking-row clickable" key={idx}>
                <div>
                  <strong>{b.client_name}</strong>
                  <p>{b.shoot_type} · {b.location}</p>
                </div>
                <div>
                  <small>{formatDate(b.shoot_date)}</small>
                  <small>{b.photographer_name || '未指定'}</small>
                </div>
                <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                  {getStatusText(b.status)}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>摄影师</h2>
            <Link to="/photographers" className="btn btn-sm btn-secondary">全部摄影师</Link>
          </div>
          {photographers.length === 0 ? (
            <div className="empty-state"><p>暂无摄影师</p></div>
          ) : (
            photographers.map((p) => (
              <Link to={`/photographers/${p.id}`} className="photographer-card clickable" key={p.id}>
                <div className="photographer-avatar">{p.name.charAt(0)}</div>
                <div className="photographer-info">
                  <h4>{p.name}</h4>
                  <p>{p.style} · {p.city} · 评分 {p.rating}</p>
                </div>
                <div className="photographer-stats">
                  <small>{p.booking_count || 0} 单</small>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>最近订单</h2>
            <Link to="/orders" className="btn btn-sm btn-secondary">全部订单</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state"><p>暂无订单</p></div>
          ) : (
            recentOrders.map((o) => (
              <Link to={`/orders/${o.id}`} className="order-row clickable" key={o.id}>
                <div className="order-main">
                  <strong>{o.order_no}</strong>
                  <span className="client-name">{o.client_name}</span>
                  <span className="order-package">{o.package_name}</span>
                </div>
                <div className="order-amount">
                  {formatCurrency(o.amount)}
                </div>
                <span className={`badge ${getStatusBadgeClass(o.status)}`}>
                  {getStatusText(o.status)}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>交付进度</h2>
            <Link to="/deliveries" className="btn btn-sm btn-secondary">全部交付</Link>
          </div>
          {pendingDeliveries.length === 0 ? (
            <div className="empty-state"><p>暂无进行中的交付</p></div>
          ) : (
            pendingDeliveries.map((d) => (
              <Link to={`/deliveries/${d.id}`} className="delivery-row clickable" key={d.id}>
                <div className="delivery-info">
                  <strong>{d.album_name || `交付 #${d.id}`}</strong>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${d.progress || 0}%` }} />
                  </div>
                </div>
                <span className={`badge ${d.progress === 100 ? 'badge-success' : 'badge-info'}`}>
                  {d.progress || 0}%
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>快捷操作</h2>
        </div>
        <div className="quick-actions">
          <Link to="/booking" className="quick-action">
            <span className="quick-action-icon">📅</span>
            <span className="quick-action-label">新建预约</span>
          </Link>
          <Link to="/photographers" className="quick-action">
            <span className="quick-action-icon">📷</span>
            <span className="quick-action-label">摄影师主页</span>
          </Link>
          <Link to="/orders" className="quick-action">
            <span className="quick-action-icon">📋</span>
            <span className="quick-action-label">订单管理</span>
          </Link>
          <Link to="/deliveries" className="quick-action">
            <span className="quick-action-icon">🖼️</span>
            <span className="quick-action-label">交付看板</span>
          </Link>
          <Link to="/reports" className="quick-action">
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-label">运营报表</span>
          </Link>
          <Link to="/reports?tab=utilization" className="quick-action">
            <span className="quick-action-icon">📈</span>
            <span className="quick-action-label">档期利用</span>
          </Link>
        </div>
      </div>
    </>
  );
}
