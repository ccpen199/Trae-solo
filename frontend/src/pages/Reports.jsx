import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../api';

function Reports() {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byStore, setByStore] = useState([]);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [providerPerformance, setProviderPerformance] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        categoryRes,
        storeRes,
        rejectRes,
        providerRes,
        trendRes
      ] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getPoliciesByCategory(),
        reportsAPI.getPoliciesByStore(),
        reportsAPI.getRejectReasons(),
        reportsAPI.getProviderPerformance(),
        reportsAPI.getMonthlyTrend()
      ]);

      const rawSummary = summaryRes;
      const summaryData = rawSummary && rawSummary.data ? rawSummary.data : rawSummary;
      setSummary(summaryData || {});

      const rawCategory = categoryRes;
      const categoryData = rawCategory && rawCategory.data ? rawCategory.data : rawCategory;
      setByCategory(Array.isArray(categoryData) ? categoryData : []);

      const rawStore = storeRes;
      const storeData = rawStore && rawStore.data ? rawStore.data : rawStore;
      setByStore(Array.isArray(storeData) ? storeData : []);

      const rawReject = rejectRes;
      const rejectData = rawReject && rawReject.data ? rawReject.data : rawReject;
      setRejectReasons(Array.isArray(rejectData) ? rejectData : []);

      const rawProvider = providerRes;
      const providerData = rawProvider && rawProvider.data ? rawProvider.data : rawProvider;
      setProviderPerformance(Array.isArray(providerData) ? providerData : []);

      const rawTrend = trendRes;
      const trendData = rawTrend && rawTrend.data ? rawTrend.data : rawTrend;
      setMonthlyTrend(Array.isArray(trendData) ? trendData : []);
    } catch (err) {
      console.error('加载报表数据失败', err);
      setError('加载报表数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>加载中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>{error}</div>
        <button className="btn btn-primary" onClick={loadData}>重新加载</button>
      </div>
    );
  }

  const claimRate = parseFloat(summary.claimRate) || 0;
  const approvalRate = parseFloat(summary.approvalRate) || 0;
  const totalPremium = parseFloat(summary.totalPremium) || 0;
  const totalPayout = parseFloat(summary.totalPayout) || 0;
  const netProfit = totalPremium - totalPayout;

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
          <h3>理赔率</h3>
          <div className="value">{claimRate.toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <h3>赔付通过率</h3>
          <div className="value">{approvalRate.toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <h3>保费收入</h3>
          <div className="value">¥{totalPremium.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>赔付支出</h3>
          <div className="value">¥{totalPayout.toFixed(2)}</div>
          <div className="trend" style={{ color: netProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
            净利润: ¥{netProfit.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h2>按品类统计</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>品类</th>
                <th>保单数</th>
                <th>保费收入</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.length > 0 ? byCategory.map(item => (
                <tr key={item.category}>
                  <td>{item.category}</td>
                  <td>{item.count}</td>
                  <td>¥{parseFloat(item.total || 0).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>按门店统计</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>门店</th>
                <th>保单数</th>
                <th>保费收入</th>
              </tr>
            </thead>
            <tbody>
              {byStore.length > 0 ? byStore.map(item => (
                <tr key={item.store_name}>
                  <td>{item.store_name}</td>
                  <td>{item.count}</td>
                  <td>¥{parseFloat(item.total || 0).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h2>拒赔原因统计</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>拒赔原因</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              {rejectReasons.length > 0 ? rejectReasons.map((item, index) => (
                <tr key={index}>
                  <td>{item.reject_reason}</td>
                  <td>{item.count}</td>
                </tr>
              )) : (
                <tr><td colSpan="2" style={{ textAlign: 'center', color: '#999' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>服务商表现</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>服务商</th>
                <th>评分</th>
                <th>工单总数</th>
                <th>完成数</th>
              </tr>
            </thead>
            <tbody>
              {providerPerformance.length > 0 ? providerPerformance.map(item => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td><span className="tag tag-warning">★ {item.rating}</span></td>
                  <td>{item.order_count}</td>
                  <td>{item.completed_count}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>月度趋势</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>月份</th>
              <th>新增保单</th>
              <th>新增理赔</th>
            </tr>
          </thead>
          <tbody>
            {monthlyTrend.length > 0 ? monthlyTrend.map(item => (
              <tr key={item.month}>
                <td>{item.month}</td>
                <td>{item.policy_count}</td>
                <td>{item.claim_count}</td>
              </tr>
            )) : (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reports;
