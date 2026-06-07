import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';

function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setDashboard(res.data.data);
    } catch (err) {
      console.error('加载管理后台数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await adminAPI.syncProvincial({});
      setSyncMessage(res.data.message);
      loadDashboard();
    } catch (err) {
      setSyncMessage('同步失败');
    }
  };

  if (loading) return <div className="container"><div className="card">加载中...</div></div>;

  const stats = dashboard?.stats || {};

  return (
    <div className="container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)', color: 'white' }}>
        <h2>管理后台</h2>
        <p style={{ opacity: 0.9, marginTop: '8px' }}>数据看板与运营管理</p>
      </div>

      <div className="grid grid-4" style={{ marginTop: '-30px' }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats.total_volunteers || 0}</div>
          <div className="stat-card-label">注册志愿者</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.total_organizations || 0}</div>
          <div className="stat-card-label">志愿组织</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.total_activities || 0}</div>
          <div className="stat-card-label">活动总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{(stats.total_hours || 0).toFixed(1)}</div>
          <div className="stat-card-label">累计服务时长</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">
            <span>⚠️ 活跃度衰减预警</span>
            <span className="tag tag-warning">{dashboard?.inactive_volunteers?.length || 0} 人预警</span>
          </div>
          {dashboard?.inactive_volunteers?.length > 0 ? (
            dashboard.inactive_volunteers.map(v => (
              <div key={v.id} className="warning-list-item">
                <span className="warning-icon">⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    最后活跃: {v.last_active_at ? new Date(v.last_active_at).toLocaleDateString() : '从未活跃'} | 
                    累计时长: {v.total_hours?.toFixed(1)}小时
                  </div>
                </div>
                <span className="tag tag-error">需关注</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              暂无衰减预警
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span>🌟 活跃志愿者 TOP10</span>
          </div>
          {dashboard?.active_volunteers?.length > 0 ? (
            dashboard.active_volunteers.map((v, i) => (
              <div key={v.id} className="resource-card">
                <div className="resource-score" style={{
                  background: i < 3 ? 'linear-gradient(135deg, #faad14 0%, #d48806 100%)' : '#1890ff'
                }}>
                  {i + 1}
                </div>
                <div className="resource-info">
                  <div className="resource-name">{v.name}</div>
                  <div className="resource-stats">服务时长: {v.total_hours?.toFixed(1)}小时</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              暂无活跃志愿者
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>📊 跨区域活动资源调度看板</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>组织名称</th>
                <th>信用评分</th>
                <th>活动数量</th>
                <th>志愿者数量</th>
                <th>资源指数</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.resource_allocation?.map(org => {
                const index = Math.round((org.credit_score * 0.4 + org.activity_count * 3 + org.volunteer_count * 2) / 0.5) / 100;
                return (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px',
                        background: org.credit_score >= 90 ? '#f6ffed' : org.credit_score >= 70 ? '#e6f7ff' : '#fff1f0',
                        color: org.credit_score >= 90 ? '#52c41a' : org.credit_score >= 70 ? '#1890ff' : '#ff4d4f'
                      }}>
                        {org.credit_score}
                      </span>
                    </td>
                    <td>{org.activity_count}</td>
                    <td>{org.volunteer_count}</td>
                    <td>
                      <div className="progress" style={{ width: '120px' }}>
                        <div className="progress-bar" style={{
                          width: `${Math.min(100, index)}%`,
                          background: index >= 60 ? '#52c41a' : index >= 30 ? '#faad14' : '#ff4d4f'
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">
            <span>☁️ 省级平台同步</span>
            <span className={`tag ${stats.pending_sync > 0 ? 'tag-warning' : 'tag-success'}`}>
              {stats.pending_sync > 0 ? `${stats.pending_sync} 条待同步` : '已同步'}
            </span>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>☁️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              将已完成的志愿服务记录同步至省级志愿服务云平台
            </p>
            {syncMessage && (
              <div className={`alert alert-success`} style={{ marginBottom: '12px' }}>{syncMessage}</div>
            )}
            <button className="btn btn-primary" onClick={handleSync}>
              立即同步
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">益币体系概览</div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#faad14' }}>
              {stats.total_yicoins || 0}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>累计发放益币</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                  {stats.total_volunteers || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>参与人数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
                  {stats.total_hours?.toFixed(1) || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>服务时长(h)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
