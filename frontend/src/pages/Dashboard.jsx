import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../api.js';

const statusLabels = {
  draft: '草稿',
  pending: '待审核',
  risk_detected: '风险已发现',
  rectifying: '整改中',
  reviewing: '复核中',
  completed: '已完成',
  rejected: '已驳回'
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await reportsApi.getDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('加载看板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  const auditStats = data?.auditStats || [];
  const riskStats = data?.riskStats || [];
  const rectStats = data?.rectStats || [];

  const getAuditCount = (status) => auditStats.find(s => s.status === status)?.count || 0;
  const getRiskCount = (status, level) => 
    riskStats.find(s => s.status === status && s.risk_level === level)?.count || 0;
  const getRectCount = (status) => rectStats.find(s => s.status === status)?.count || 0;

  return (
    <div>
      <div className="page-header">
        <h2>📊 数据看板</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">审计总数</div>
          <div className="value">{auditStats.reduce((sum, s) => sum + s.count, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="label">待处理</div>
          <div className="value" style={{ color: '#f39c12' }}>
            {getAuditCount('pending') + getAuditCount('risk_detected')}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">整改中</div>
          <div className="value" style={{ color: '#3498db' }}>{getAuditCount('rectifying')}</div>
        </div>
        <div className="stat-card">
          <div className="label">已完成</div>
          <div className="value" style={{ color: '#27ae60' }}>{getAuditCount('completed')}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card high">
          <div className="label">高风险待处理</div>
          <div className="value">{getRiskCount('open', 'high') + getRiskCount('confirmed', 'high')}</div>
        </div>
        <div className="stat-card medium">
          <div className="label">中风险待处理</div>
          <div className="value">{getRiskCount('open', 'medium') + getRiskCount('confirmed', 'medium')}</div>
        </div>
        <div className="stat-card low">
          <div className="label">低风险待处理</div>
          <div className="value">{getRiskCount('open', 'low') + getRiskCount('confirmed', 'low')}</div>
        </div>
        <div className="stat-card">
          <div className="label">整改逾期</div>
          <div className="value" style={{ color: '#e74c3c' }}>{data?.overdueCount || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3>最近审计任务</h3>
        {data?.recentAudits?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>状态</th>
                <th>负责人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAudits.map(audit => (
                <tr key={audit.id}>
                  <td>{audit.id}</td>
                  <td>{audit.title}</td>
                  <td><span className={`status-badge status-${audit.status}`}>{statusLabels[audit.status]}</span></td>
                  <td>{audit.assignee_name || '-'}</td>
                  <td>{new Date(audit.created_at).toLocaleString()}</td>
                  <td><Link to={`/audits/${audit.id}`} className="link">查看</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无审计任务</div>
        )}
      </div>

      <div className="stats-grid">
        <div className="card">
          <h3>整改状态分布</h3>
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span className="status-badge status-pending">待开始: {getRectCount('pending')}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span className="status-badge status-in_progress">进行中: {getRectCount('in_progress')}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span className="status-badge status-submitted">待复核: {getRectCount('submitted')}</span>
            </div>
            <div>
              <span className="status-badge status-approved">已通过: {getRectCount('approved')}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>快捷操作</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/audits" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              创建审计任务
            </Link>
            <Link to="/materials" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              上传审计材料
            </Link>
            <Link to="/rectifications" className="btn btn-warning" style={{ textDecoration: 'none', textAlign: 'center' }}>
              查看整改任务
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
