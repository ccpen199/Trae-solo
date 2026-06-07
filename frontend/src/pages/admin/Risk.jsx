import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

function AdminRisk() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await adminAPI.getRisk();
      setData(result);
    } catch (e) {
      console.error('Load risk data failed:', e);
    }
  };

  const handleFlagUser = async (userId, riskLevel) => {
    try {
      await adminAPI.flagUser(userId, { risk_level: riskLevel, reason: '手动标记' });
      loadData();
    } catch (e) {
      alert('操作失败');
    }
  };

  const getRiskClass = (level) => {
    if (level >= 3) return 'risk-high';
    if (level >= 2) return 'risk-medium';
    if (level >= 1) return 'risk-low';
    return '';
  };

  const getRiskLabel = (level) => {
    if (level >= 3) return '高风险';
    if (level >= 2) return '中风险';
    if (level >= 1) return '低风险';
    return '正常';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>风控中心</h1>

      <div className="stats-grid">
        {data?.risk_level_stats?.map((row, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-value">{row.user_count}</div>
            <div className="stat-label">{row.risk_level}用户</div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '1rem' }}>风险用户列表</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>手机号</th>
              <th>风险等级</th>
              <th>关联订单</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.suspicious_orders?.slice(0, 20).map((order, idx) => (
              <tr key={idx}>
                <td>{order.nickname}</td>
                <td>{order.phone}</td>
                <td className={getRiskClass(order.risk_level)}>
                  {getRiskLabel(order.risk_level)}
                </td>
                <td>{order.event_title}</td>
                <td>
                  <select
                    defaultValue={order.risk_level}
                    onChange={(e) => handleFlagUser(order.user_id, parseInt(e.target.value))}
                    style={{ padding: '0.25rem', borderRadius: '4px' }}
                  >
                    <option value={0}>正常</option>
                    <option value={1}>低风险</option>
                    <option value={2}>中风险</option>
                    <option value={3}>高风险</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '1rem' }}>最近风险记录</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>风险类型</th>
              <th>风险分数</th>
              <th>详情</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {data?.recent_risks?.slice(0, 10).map((record, idx) => (
              <tr key={idx}>
                <td>{record.nickname}</td>
                <td>{record.risk_type}</td>
                <td>{record.risk_score}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {record.details}
                </td>
                <td>{record.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminRisk;
