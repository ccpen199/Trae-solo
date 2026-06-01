import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [riskUsers, setRiskUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, riskRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRiskUsers(),
      ]);
      setStats(statsRes.data);
      setRiskUsers(riskRes.data.high_risk_users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: '总用户数', value: stats.users, icon: '👥', color: '#3b82f6' },
    { label: '职位总数', value: stats.jobs, icon: '💼', color: '#10b981' },
    { label: '简历总数', value: stats.resumes, icon: '📄', color: '#8b5cf6' },
    { label: '投递总数', value: stats.applications, icon: '📮', color: '#f59e0b' },
    { label: '企业总数', value: stats.companies, icon: '🏢', color: '#06b6d4' },
    { label: '已认证企业', value: stats.verified_companies, icon: '✅', color: '#22c55e' },
    { label: '待认证企业', value: stats.pending_verifications, icon: '⏳', color: '#f97316' },
    { label: '待处理举报', value: stats.pending_reports, icon: '⚠️', color: '#ef4444' },
    { label: '冻结账号', value: stats.frozen_users, icon: '❄️', color: '#64748b' },
  ] : [];

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ 管理后台</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin/reports" className="btn btn-secondary">举报管理</Link>
          <Link to="/admin/verifications" className="btn btn-secondary">企业认证</Link>
          <Link to="/admin/users" className="btn btn-secondary">用户管理</Link>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map((card, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${card.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{card.value.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>⚠️ 高风险用户检测</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            基于设备指纹和行为时序分析
          </span>
        </div>

        {riskUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            暂无高风险用户
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>设备指纹</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>关联账号</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>操作次数</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>首次出现</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>最近活跃</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>风险等级</th>
              </tr>
            </thead>
            <tbody>
              {riskUsers.slice(0, 10).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>
                    {item.device_fingerprint.substring(0, 16)}...
                  </td>
                  <td style={{ padding: 12 }}>
                    <span className="badge badge-danger">{item.account_count} 个账号</span>
                  </td>
                  <td style={{ padding: 12 }}>{item.action_count}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{item.first_seen?.replace('T', ' ').substring(0, 16)}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{item.last_seen?.replace('T', ' ').substring(0, 16)}</td>
                  <td style={{ padding: 12 }}>
                    <span className="badge badge-danger">高风险</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
