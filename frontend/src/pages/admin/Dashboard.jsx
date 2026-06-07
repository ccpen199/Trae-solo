import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

function AdminDashboard() {
  const [boxOffice, setBoxOffice] = useState(null);
  const [audience, setAudience] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [boxOfficeData, audienceData] = await Promise.all([
        adminAPI.getBoxOffice(),
        adminAPI.getAudience(),
      ]);
      setBoxOffice(boxOfficeData);
      setAudience(audienceData);
    } catch (e) {
      console.error('Load dashboard failed:', e);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>后台管理数据概览</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        管理后台汇总票房、订单、用户、库存和风控核心指标，支持运营团队快速复核业务状态。
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <a className="stat-card" href="/admin/box-office" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">订单管理</div>
          <div style={{ marginTop: '0.5rem', color: '#667eea', fontWeight: 700 }}>票房订单与支付状态</div>
        </a>
        <a className="stat-card" href="/admin/audience" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">用户管理</div>
          <div style={{ marginTop: '0.5rem', color: '#667eea', fontWeight: 700 }}>观众画像与注册用户</div>
        </a>
        <a className="stat-card" href="/admin/inventory" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">商品管理</div>
          <div style={{ marginTop: '0.5rem', color: '#667eea', fontWeight: 700 }}>票品库存与场次管理</div>
        </a>
        <a className="stat-card" href="/admin/risk" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-label">运营数据</div>
          <div style={{ marginTop: '0.5rem', color: '#667eea', fontWeight: 700 }}>风控预警与运营复核</div>
        </a>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">¥{boxOffice?.summary?.total_revenue?.toFixed(0) || 0}</div>
          <div className="stat-label">总票房</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{boxOffice?.summary?.total_orders || 0}</div>
          <div className="stat-label">总订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{audience?.total_users || 0}</div>
          <div className="stat-label">注册用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{boxOffice?.summary?.avg_order_value?.toFixed(0) || 0}</div>
          <div className="stat-label">客单价</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '1rem' }}>票房趋势</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>订单数</th>
              <th>票房</th>
              <th>购票人数</th>
            </tr>
          </thead>
          <tbody>
            {boxOffice?.data?.slice(0, 10).map((row, idx) => (
              <tr key={idx}>
                <td>{row.period}</td>
                <td>{row.order_count}</td>
                <td>¥{row.total_revenue?.toFixed(2)}</td>
                <td>{row.buyer_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
