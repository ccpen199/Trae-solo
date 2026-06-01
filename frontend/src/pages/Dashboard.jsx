import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data);
    } catch (err) {
      console.error('加载统计失败', err);
    }
  };

  const getCount = (arr, status) => {
    const item = arr?.find(i => i.status === status);
    return item?.count || 0;
  };

  if (!stats) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.users?.total || 0}</div>
          <div className="stat-label">👥 用户总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getCount(stats.applications, 'approved')}</div>
          <div className="stat-label">✅ 已接入应用</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getCount(stats.change_orders, 'approving')}</div>
          <div className="stat-label">⏳ 审批中变更单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getCount(stats.tasks, 'success')}</div>
          <div className="stat-label">⚡ 成功执行任务</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today_approvals?.count || 0}</div>
          <div className="stat-label">📋 今日审批</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff4d4f' }}>{getCount(stats.exceptions, 'pending')}</div>
          <div className="stat-label">⚠️ 待处理异常</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📱 应用状态分布</h3>
          <div>
            {stats.applications?.map(item => (
              <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span><span className={`status-badge status-${item.status}`}>{item.status}</span></span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📝 变更单状态</h3>
          <div>
            {stats.change_orders?.map(item => (
              <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span><span className={`status-badge status-${item.status}`}>{item.status}</span></span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
