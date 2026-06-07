import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';

function AdminBoxOffice() {
  const [data, setData] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [city, setCity] = useState('');

  useEffect(() => {
    loadData();
  }, [groupBy, city]);

  const loadData = async () => {
    try {
      const result = await adminAPI.getBoxOffice({ group_by: groupBy, city });
      setData(result);
    } catch (e) {
      console.error('Load box office failed:', e);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>票房看板</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="day">按天</option>
          <option value="month">按月</option>
          <option value="city">按城市</option>
          <option value="event">按活动</option>
        </select>
        <input
          type="text"
          placeholder="输入城市筛选"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">¥{data?.summary?.total_revenue?.toFixed(0) || 0}</div>
          <div className="stat-label">总票房</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.summary?.total_orders || 0}</div>
          <div className="stat-label">总订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.summary?.total_buyers || 0}</div>
          <div className="stat-label">购票人数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{data?.summary?.avg_order_value?.toFixed(0) || 0}</div>
          <div className="stat-label">平均客单价</div>
        </div>
      </div>

      <div className="chart-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>维度</th>
              <th>订单数</th>
              <th>票房</th>
              <th>购票人数</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((row, idx) => (
              <tr key={idx}>
                <td>{row.period || row.city || row.type}</td>
                <td>{row.order_count}</td>
                <td style={{ color: '#667eea', fontWeight: '600' }}>¥{row.total_revenue?.toFixed(2)}</td>
                <td>{row.buyer_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBoxOffice;
