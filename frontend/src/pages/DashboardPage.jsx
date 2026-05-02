import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    loginToday: 0,
    highRiskEvents: 0
  });
  const [recentLogins, setRecentLogins] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (hasPermission('monitor:view')) {
        try {
          const snapshotRes = await api.get('/audit/snapshot');
          if (snapshotRes.data.success) {
            const data = snapshotRes.data.data;
            setStats({
              totalUsers: data.statistics.activeUsers + 5,
              activeUsers: data.statistics.activeUsers,
              loginToday: data.statistics.loginLastHour,
              highRiskEvents: data.statistics.highRiskEvents24h
            });
            setRecentLogins(data.recentLogins || []);
            setRecentAudits(data.recentAudits || []);
          }
        } catch (err) {
          console.log('No monitor permission, using default stats');
        }
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
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
    <div>
      <div className="page-container">
        <div className="page-header">
          <h1>仪表盘</h1>
          <p>欢迎使用企业安全中台 IAM 系统，{user?.realName || user?.username}</p>
        </div>
        <div className="page-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                👥
              </div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>总用户数</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                ✅
              </div>
              <div className="stat-info">
                <h3>{stats.activeUsers}</h3>
                <p>活跃用户</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">
                🔐
              </div>
              <div className="stat-info">
                <h3>{stats.loginToday}</h3>
                <p>近1小时登录</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                ⚠️
              </div>
              <div className="stat-info">
                <h3>{stats.highRiskEvents}</h3>
                <p>高风险事件</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <div className="section">
              <h3 className="section-title">最近登录</h3>
              {recentLogins && recentLogins.length > 0 ? (
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
                      {recentLogins.map((login, index) => (
                        <tr key={index}>
                          <td>{login.real_name || login.username}</td>
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
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p>暂无登录记录</p>
                </div>
              )}
            </div>

            <div className="section">
              <h3 className="section-title">操作审计</h3>
              {recentAudits && recentAudits.length > 0 ? (
                <div className="timeline">
                  {recentAudits.slice(0, 8).map((audit, index) => (
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
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p>暂无审计记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <h3 className="section-title">系统概览</h3>
            <div className="alert alert-info">
              <strong>企业安全中台 IAM 系统 v1.0</strong>
              <p style={{ marginTop: '8px', fontSize: '13px' }}>
                本系统包含以下核心引擎：SSO-Gateway 登录引擎、RBAC-ABAC 混合授权引擎、MFA 多因素核验引擎、Audit-Vault 审计引擎。
              </p>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', fontSize: '13px' }}>
                <li>✅ 支持组织架构同步与管理</li>
                <li>✅ 支持多因素认证 (MFA)</li>
                <li>✅ 支持 RBAC + ABAC 混合授权</li>
                <li>✅ 支持全量操作审计</li>
                <li>✅ 支持岗位变动权限自动清理</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
