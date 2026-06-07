import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

function AdminAudience() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await adminAPI.getAudience();
      setData(result);
    } catch (e) {
      console.error('Load audience failed:', e);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>观众画像</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data?.total_users || 0}</div>
          <div className="stat-label">总用户数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.active_users || 0}</div>
          <div className="stat-label">活跃用户</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="chart-container">
          <h3 style={{ marginBottom: '1rem' }}>购票频次分布</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>频次区间</th>
                <th>用户数</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              {data?.purchase_frequency?.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.frequency}</td>
                  <td>{row.user_count}</td>
                  <td>
                    {data?.total_users
                      ? ((row.user_count / data.total_users) * 100).toFixed(1) + '%'
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <h3 style={{ marginBottom: '1rem' }}>价格敏感度分布</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>敏感度等级</th>
                <th>用户数</th>
                <th>平均消费</th>
              </tr>
            </thead>
            <tbody>
              {data?.price_sensitivity?.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.sensitivity_level}</td>
                  <td>{row.user_count}</td>
                  <td>¥{row.avg_spent?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data?.category_migration?.length > 0 && (
        <div className="chart-container">
          <h3 style={{ marginBottom: '1rem' }}>跨品类迁移分析</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>原品类</th>
                <th>新品类</th>
                <th>迁移用户数</th>
              </tr>
            </thead>
            <tbody>
              {data.category_migration.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.from_type}</td>
                  <td>{row.to_type}</td>
                  <td>{row.user_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAudience;
