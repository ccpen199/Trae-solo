import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { risksApi } from '../api.js';

const statusLabels = {
  open: '待处理',
  confirmed: '已确认',
  false_positive: '误判',
  rectified: '已整改'
};

function Risks() {
  const [risks, setRisks] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    risk_level: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRisks();
  }, [filters]);

  const loadRisks = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await risksApi.getAll(params);
      if (res.data.success) {
        setRisks(res.data.data);
      }
    } catch (error) {
      console.error('加载风险列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>⚠️ 风险清单</h2>
      </div>

      <div className="filter-bar">
        <select 
          value={filters.status} 
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select 
          value={filters.risk_level} 
          onChange={e => setFilters({ ...filters, risk_level: e.target.value })}
        >
          <option value="">全部等级</option>
          <option value="high">高风险</option>
          <option value="medium">中风险</option>
          <option value="low">低风险</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : risks.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>风险描述</th>
                <th>关联审计</th>
                <th>规则</th>
                <th>等级</th>
                <th>状态</th>
                <th>检测时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {risks.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.audit_title || '-'}</td>
                  <td>{r.rule_name || '-'}</td>
                  <td><span className={`status-badge risk-${r.risk_level}`}>{r.risk_level}</span></td>
                  <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td><Link to={`/risks/${r.id}`} className="link">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无风险记录</div>
        )}
      </div>
    </div>
  );
}

export default Risks;
