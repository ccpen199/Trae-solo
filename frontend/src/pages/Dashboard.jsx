import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, policiesAPI, claimsAPI } from '../api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentPolicies, setRecentPolicies] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, policiesRes, claimsRes] = await Promise.all([
        reportsAPI.getSummary(),
        policiesAPI.getAll({}),
        claimsAPI.getAll({})
      ]);

      const rawSummary = summaryRes;
      const summaryData = rawSummary && rawSummary.data ? rawSummary.data : rawSummary;
      setSummary(summaryData || {});

      const rawPolicies = policiesRes;
      const policiesData = rawPolicies && rawPolicies.data ? rawPolicies.data : (Array.isArray(rawPolicies) ? rawPolicies : []);
      setRecentPolicies(Array.isArray(policiesData) ? policiesData.slice(0, 5) : []);

      const rawClaims = claimsRes;
      const claimsData = rawClaims && rawClaims.data ? rawClaims.data : (Array.isArray(rawClaims) ? rawClaims : []);
      setRecentClaims(Array.isArray(claimsData) ? claimsData.slice(0, 5) : []);
    } catch (error) {
      console.error('加载数据失败', error);
      setSummary({});
      setRecentPolicies([]);
      setRecentClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getStatusTag = (status) => {
    const map = {
      active: <span className="tag tag-success">有效</span>,
      expired: <span className="tag tag-default">已过期</span>,
      pending: <span className="tag tag-warning">待审核</span>,
      approved: <span className="tag tag-success">已通过</span>,
      rejected: <span className="tag tag-danger">已拒赔</span>
    };
    return map[status] || <span className="tag tag-default">{status || '-'}</span>;
  };

  const netProfit = (summary && summary.totalPremium || 0) - (summary && summary.totalPayout || 0);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>加载中...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>保单总数</h3>
          <div className="value">{summary.totalPolicies || 0}</div>
          <div className="trend">有效: {summary.activePolicies || 0}</div>
        </div>
        <div className="stat-card">
          <h3>理赔申请</h3>
          <div className="value">{summary.totalClaims || 0}</div>
          <div className="trend">通过: {summary.approvedClaims || 0} / 拒赔: {summary.rejectedClaims || 0}</div>
        </div>
        <div className="stat-card">
          <h3>保费收入</h3>
          <div className="value">¥{(summary.totalPremium || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>赔付支出</h3>
          <div className="value">¥{(summary.totalPayout || 0).toFixed(2)}</div>
          <div className="trend" style={{ color: netProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
            净利润: ¥{netProfit.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header"><h2>最近保单</h2></div>
          <table className="table">
            <thead><tr><th>保单号</th><th>产品</th><th>用户</th><th>设备</th><th>状态</th></tr></thead>
            <tbody>
              {recentPolicies.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',color:'#999'}}>暂无数据</td></tr>}
              {recentPolicies.map(p => (
                <tr key={p.id || Math.random()}>
                  <td>{p.policy_no || '-'}</td>
                  <td>{p.product_name || '-'}</td>
                  <td>{p.user_name || '-'}</td>
                  <td>{p.device_serial || '-'}</td>
                  <td>{getStatusTag(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><h2>最近理赔</h2></div>
          <table className="table">
            <thead><tr><th>理赔号</th><th>保单号</th><th>故障类型</th><th>用户</th><th>状态</th></tr></thead>
            <tbody>
              {recentClaims.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',color:'#999'}}>暂无数据</td></tr>}
              {recentClaims.map(c => (
                <tr key={c.id || Math.random()}>
                  <td>{c.claim_no || '-'}</td>
                  <td>{c.policy_no || '-'}</td>
                  <td>{c.fault_type || '-'}</td>
                  <td>{c.user_name || '-'}</td>
                  <td>{getStatusTag(c.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
