import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lots, setLots] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      setError(null);
      const [statsData, lotsData, trafficData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardLots(),
        api.getHourlyTraffic()
      ]);
      setStats(statsData);
      setLots(lotsData);
      setTraffic(trafficData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="card"><p>加载中...</p></div>;

  if (error) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">❌</div>
          <p>数据加载失败: {error}</p>
          <button className="btn btn-primary" style={{marginTop: '1rem'}} onClick={loadData}>重新加载</button>
        </div>
      </div>
    );
  }

  const maxTraffic = Math.max(...traffic.map(t => t.entries), 1);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>📊 运营看板</h2>
      
      <div className="stats-grid">
        <div className="stat-card info">
          <div className="label">停车场总数</div>
          <div className="value">{stats?.total_lots || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">总车位</div>
          <div className="value">{stats?.total_spots || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="label">空闲车位</div>
          <div className="value">{stats?.available_spots || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">占用车位</div>
          <div className="value">{stats?.occupied_spots || 0}</div>
        </div>
        <div className="stat-card info">
          <div className="label">今日车流</div>
          <div className="value">{stats?.today_records || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="label">今日营收</div>
          <div className="value">¥{stats?.today_revenue || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">诱导转化率</div>
          <div className="value">{stats?.conversion_rate || 0}%</div>
        </div>
        <div className="stat-card">
          <div className="label">车位周转率</div>
          <div className="value">{stats?.turnover_rate || 0}%</div>
        </div>
        <div className={`stat-card ${stats?.offline_devices > 0 ? 'danger' : 'success'}`}>
          <div className="label">离线设备</div>
          <div className="value">{stats?.offline_devices || 0}</div>
        </div>
      </div>

      <div className="card">
        <h2>🚦 24小时车流趋势</h2>
        <div className="chart-container">
          {traffic.map((t, i) => (
            <div key={i} className="chart-bar" style={{ height: `${Math.max((t.entries / maxTraffic) * 100, 2)}%` }}>
              <span className="label">{t.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>🏢 停车场概览</h2>
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>地址</th>
              <th>总车位</th>
              <th>空闲</th>
              <th>占用</th>
              <th>诱导点击</th>
              <th>到达转化</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {lots.length > 0 ? lots.map(lot => (
              <tr key={lot.id}>
                <td>{lot.name}</td>
                <td>{lot.address}</td>
                <td>{lot.total_spots}</td>
                <td>{lot.available || 0}</td>
                <td>{lot.occupied || 0}</td>
                <td>{lot.clicks || 0}</td>
                <td>{lot.arrived || 0}</td>
                <td>
                  <span className={`badge ${lot.device_status === 'online' ? 'badge-success' : 'badge-danger'}`}>
                    {lot.device_status === 'online' ? '在线' : '离线'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="icon">🏢</div>
                    <p>暂无停车场数据</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>请先在「管理后台」初始化演示数据</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
