import React, { useState, useEffect } from 'react';
import { recipes, materials, costs, quotes } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    recipes: 0,
    materials: 0,
    costRecords: 0,
    quotes: 0
  });
  const [recentCosts, setRecentCosts] = useState([]);
  const [recentQuotes, setRecentQuotes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [r, m, c, q] = await Promise.all([
        recipes.getAll(),
        materials.getAll(),
        costs.getAll(),
        quotes.getAll()
      ]);
      
      setStats({
        recipes: r.data.length,
        materials: m.data.length,
        costRecords: c.data.length,
        quotes: q.data.length
      });
      setRecentCosts(c.data.slice(0, 5));
      setRecentQuotes(q.data.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>仪表盘</h2>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">配方总数</div>
          <div className="value">{stats.recipes}</div>
        </div>
        <div className="stat-card">
          <div className="label">原料数量</div>
          <div className="value">{stats.materials}</div>
        </div>
        <div className="stat-card">
          <div className="label">成本计算</div>
          <div className="value">{stats.costRecords}</div>
        </div>
        <div className="stat-card">
          <div className="label">报价单</div>
          <div className="value">{stats.quotes}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>最近成本计算</h3>
          <table>
            <thead>
              <tr>
                <th>配方</th>
                <th>总成本</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {recentCosts.map(c => (
                <tr key={c.id}>
                  <td>{c.recipe_name}</td>
                  <td>¥{c.total_cost.toFixed(2)}</td>
                  <td>{c.calculation_date}</td>
                </tr>
              ))}
              {recentCosts.length === 0 && (
                <tr><td colSpan="3" className="empty-state">暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>最近报价单</h3>
          <table>
            <thead>
              <tr>
                <th>报价号</th>
                <th>配方</th>
                <th>最终价格</th>
                <th>毛利率</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.map(q => (
                <tr key={q.id}>
                  <td>{q.quote_no}</td>
                  <td>{q.recipe_name}</td>
                  <td>¥{q.final_price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${q.actual_margin < 20 ? 'badge-warning' : 'badge-success'}`}>
                      {q.actual_margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {recentQuotes.length === 0 && (
                <tr><td colSpan="4" className="empty-state">暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
