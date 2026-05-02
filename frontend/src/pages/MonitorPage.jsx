import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function MonitorPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchSnapshot();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSnapshot, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/snapshot');
      if (response.data.success) {
        setSnapshot(response.data.data);
      }
    } catch (error) {
      console.error('Fetch snapshot error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return 'status-badge high';
      case 'medium':
        return 'status-badge medium';
      default:
        return 'status-badge low';
    }
  };

  const getLoginResultClass = (result) => {
    return result === 'success' ? 'status-badge success' : 'status-badge failed';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>实时监控</h1>
            <p>系统实时运行状态监控和安全事件追踪</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>自动刷新 (5秒)</span>
            </label>
            <button className="filter-btn" onClick={fetchSnapshot}>
              🔄 刷新
            </button>
          </div>
        </div>
      </div>
      <div className="page-content">
        {loading && !snapshot ? (
          <div className="empty-state">
            <div className="loading-spinner-large"></div>
            <p style={{ marginTop: '16px' }}>加载中...</p>
          </div>
        ) : snapshot ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  👥
                </div>
                <div className="stat-info">
                  <h3>{snapshot.statistics?.activeUsers || 0}</h3>
                  <p>活跃用户</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  🔐
                </div>
                <div className="stat-info">
                  <h3>{snapshot.statistics?.loginLastHour || 0}</h3>
                  <p>近1小时登录</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">
                  ⚠️
                </div>
                <div className="stat-info">
                  <h3>{snapshot.statistics?.loginFailures24h || 0}</h3>
                  <p>24h登录失败</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">
                  🔥
                </div>
                <div className="stat-info">
                  <h3>{snapshot.statistics?.highRiskEvents24h || 0}</h3>
                  <p>高风险事件</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              <div className="section">
                <h3 className="section-title">最近登录</h3>
                {snapshot.recentLogins && snapshot.recentLogins.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>用户</th>
                          <th>结果</th>
                          <th>IP地址</th>
                          <th>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.recentLogins.slice(0, 10).map((login, index) => (
                          <tr key={index}>
                            <td>{login.real_name || login.username || '-'}</td>
                            <td>
                              <span className={getLoginResultClass(login.login_result)}>
                                {login.login_result === 'success' ? '成功' : '失败'}
                              </span>
                            </td>
                            <td>{login.ip_address || '-'}</td>
                            <td>{formatTime(login.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state" style={{ minHeight: '150px' }}>
                    <div className="empty-state-icon">📊</div>
                    <p>暂无登录记录</p>
                  </div>
                )}
              </div>

              <div className="section">
                <h3 className="section-title">最近操作审计</h3>
                {snapshot.recentAudits && snapshot.recentAudits.length > 0 ? (
                  <div className="timeline">
                    {snapshot.recentAudits.slice(0, 10).map((audit, index) => (
                      <div key={index} className={`timeline-item ${audit.risk_level === 'high' || audit.risk_level === 'critical' ? 'error' : ''}`}>
                        <div className="timeline-time">{formatTime(audit.created_at)}</div>
                        <div className="timeline-content">
                          <p>
                            <strong>{audit.action}</strong>
                            <span className={getRiskBadgeClass(audit.risk_level)} style={{ marginLeft: '8px' }}>
                              {audit.risk_level}
                            </span>
                          </p>
                          <span>操作人: {audit.username || 'system'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ minHeight: '150px' }}>
                    <div className="empty-state-icon">📋</div>
                    <p>暂无审计记录</p>
                  </div>
                )}
              </div>
            </div>

            {snapshot.activeLogins && snapshot.activeLogins.length > 0 && (
              <div className="section">
                <h3 className="section-title">活跃会话</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th>登录时间</th>
                        <th>IP地址</th>
                        <th>设备</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.activeLogins.slice(0, 10).map((login, index) => (
                        <tr key={index}>
                          <td>{login.username || login.real_name || '-'}</td>
                          <td>{formatTime(login.login_time)}</td>
                          <td>{login.ip_address || '-'}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {login.user_agent || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <p>暂无监控数据</p>
          </div>
        )}

        <div className="alert alert-info">
          <strong>实时监控功能说明</strong>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            实时监控提供系统运行状态的即时视图：
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>活跃用户</strong>：当前系统中的活跃用户统计</li>
            <li><strong>登录统计</strong>：近1小时登录量、24小时登录失败数</li>
            <li><strong>高风险事件</strong>：识别需要关注的安全事件</li>
            <li><strong>活跃会话</strong>：当前已登录的用户会话</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MonitorPage;
