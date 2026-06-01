import React, { useEffect, useState } from 'react';
import { apiGet } from '../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const statsData = await apiGet('/dashboard/stats');
    setStats(statsData);
    
    const alerts = await apiGet('/alerts');
    setRecentAlerts(alerts.slice(0, 5));
  }

  if (!stats) return <div>加载中...</div>;

  return (
    <div>
      <div className="header">
        <h1>仪表盘</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">生产批次总数</div>
          <div className="value">{stats.total_batches}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">待处理预警</div>
          <div className="value">{stats.pending_alerts}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">待处理纠偏</div>
          <div className="value">{stats.pending_actions}</div>
        </div>
        <div className="stat-card">
          <div className="label">活跃产品</div>
          <div className="value">{stats.active_products}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">校准即将到期</div>
          <div className="value">{stats.calibration_due}</div>
        </div>
        <div className="stat-card">
          <div className="label">今日超限</div>
          <div className="value">{stats.violations_today}</div>
        </div>
      </div>

      <div className="card">
        <h2>最近预警</h2>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>批次</th>
              <th>消息</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {recentAlerts.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>暂无预警</td></tr>
            ) : recentAlerts.map(alert => (
              <tr key={alert.id}>
                <td>{alert.created_at}</td>
                <td>{alert.batch_no}</td>
                <td>{alert.message}</td>
                <td>
                  <span className={`badge ${alert.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {alert.status === 'pending' ? '待处理' : '已处理'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
