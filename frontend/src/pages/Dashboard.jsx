import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api.js';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      setData(res.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const { overview, topChannels, topPerformers, funnel } = data || {};

  return (
    <div>
      <div className="page-header">
        <h1>📊 数据看板</h1>
        <p>招聘效能实时监控与智能决策中心</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-value">¥{overview?.totalSpent?.toLocaleString() || 0}</div>
          <div className="stat-label">累计招聘投入</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview?.totalHires || 0}</div>
          <div className="stat-label">累计录用人数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{overview?.avgCostPerHire?.toLocaleString() || 0}</div>
          <div className="stat-label">人均招聘成本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview?.avgQualityScore || 0}</div>
          <div className="stat-label">候选人质量分</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">🔥 招聘漏斗转化</div>
          <div className="funnel-container">
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ height: '100%' }}>
                {funnel?.total_candidates || 0}
              </div>
              <div className="funnel-label">候选人</div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ height: `${(funnel?.scheduled / (funnel?.total_candidates || 1)) * 100}%` }}>
                {funnel?.scheduled || 0}
              </div>
              <div className="funnel-label">待面试</div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ height: `${(funnel?.passed / (funnel?.total_candidates || 1)) * 100}%` }}>
                {funnel?.passed || 0}
              </div>
              <div className="funnel-label">通过</div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ height: `${(funnel?.hired / (funnel?.total_candidates || 1)) * 100}%` }}>
                {funnel?.hired || 0}
              </div>
              <div className="funnel-label">已录用</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <strong>整体转化率：</strong>
            <span style={{ color: '#4caf50', marginLeft: '8px' }}>
              {funnel?.conversionRates?.overall || 0}%
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">⭐ 优质招聘渠道</div>
          {topChannels && topChannels.length > 0 ? (
            topChannels.map((channel, idx) => (
              <div key={channel.id} className="channel-card">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {idx + 1}. {channel.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    质量分：<strong style={{ color: '#4caf50' }}>{channel.qualityScore}</strong> | 
                    获客单价：¥{channel.costPerApplicant}
                  </div>
                </div>
                <span className="badge badge-published">ROI {channel.roi}x</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div>暂无渠道数据</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">👑 招聘达人榜</div>
          {topPerformers && topPerformers.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>成员</th>
                  <th>月均录用</th>
                  <th>通过率</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map(member => (
                  <tr key={member.id}>
                    <td>{member.email}</td>
                    <td>{member.hiresPerMonth} 人</td>
                    <td>{member.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div>暂无团队数据</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📋 核心指标</div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>在招职位数</div>
              </div>
              <span className="badge badge-draft">{overview?.openPositions || 0} 个</span>
            </div>
            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>人才库总量</div>
              </div>
              <span className="badge badge-published">{overview?.totalCandidates || 0} 人</span>
            </div>
            <div className="channel-card">
              <div>
                <div style={{ fontWeight: 600 }}>团队人均月录用</div>
              </div>
              <span className="badge badge-reviewed">{overview?.avgHiresPerMonth || 0} 人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
