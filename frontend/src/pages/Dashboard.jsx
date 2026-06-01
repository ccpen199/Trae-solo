import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const res = await api.get('/dashboard');
    setStats(res.data);
  };

  const getOrderCount = (status) => {
    if (!stats?.order_stats) return 0;
    const item = stats.order_stats.find(s => s.status === status);
    return item ? item.count : 0;
  };

  return (
    <div>
      <div className="page-header">
        <h1>仪表盘</h1>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>今日订单</h3>
          <div className="value">{stats?.today_orders || 0}</div>
        </div>
        <div className="stat-card">
          <h3>待拣配</h3>
          <div className="value">{stats?.pending_pickings || 0}</div>
        </div>
        <div className="stat-card">
          <h3>待收货</h3>
          <div className="value">{stats?.pending_receipts || 0}</div>
        </div>
        <div className="stat-card">
          <h3>进行中订单</h3>
          <div className="value">{getOrderCount('picking') + getOrderCount('shipped')}</div>
        </div>
      </div>
      
      <div className="card">
        <h3>订单状态分布</h3>
        <div className="stats-grid" style={{ marginTop: '20px' }}>
          <div className="stat-card">
            <h3>草稿</h3>
            <div className="value">{getOrderCount('draft')}</div>
          </div>
          <div className="stat-card">
            <h3>拣配中</h3>
            <div className="value">{getOrderCount('picking')}</div>
          </div>
          <div className="stat-card">
            <h3>已发货</h3>
            <div className="value">{getOrderCount('shipped')}</div>
          </div>
          <div className="stat-card">
            <h3>已收货</h3>
            <div className="value">{getOrderCount('received')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
