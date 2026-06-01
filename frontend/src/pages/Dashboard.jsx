import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFactories: 0,
    verifiedFactories: 0,
    pendingAudit: 0,
    expiringCerts: 0
  });
  const [recentFactories, setRecentFactories] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
    
    fetch('/api/factories')
      .then(res => res.json())
      .then(data => setRecentFactories(data.slice(0, 5)));
  }, []);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>工厂总数</h3>
          <div className="number">{stats.totalFactories}</div>
        </div>
        <div className="stat-card">
          <h3>已认证工厂</h3>
          <div className="number">{stats.verifiedFactories}</div>
        </div>
        <div className="stat-card">
          <h3>待审核</h3>
          <div className="number">{stats.pendingAudit}</div>
        </div>
        <div className="stat-card">
          <h3>即将过期资质</h3>
          <div className="number">{stats.expiringCerts}</div>
        </div>
      </div>

      <div className="card">
        <h2>最近录入的工厂</h2>
        <table className="table">
          <thead>
            <tr>
              <th>工厂名称</th>
              <th>地区</th>
              <th>品类</th>
              <th>规模</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentFactories.map(factory => (
              <tr key={factory.id}>
                <td>{factory.name}</td>
                <td>{factory.region || '-'}</td>
                <td>{factory.category || '-'}</td>
                <td>{factory.scale || '-'}</td>
                <td>
                  <span className={`badge ${factory.is_verified ? 'badge-success' : 'badge-warning'}`}>
                    {factory.is_verified ? '已认证' : '待审核'}
                  </span>
                </td>
                <td>
                  <Link to={`/factories/${factory.id}`} className="link">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentFactories.length === 0 && (
          <div className="empty">暂无工厂数据</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
