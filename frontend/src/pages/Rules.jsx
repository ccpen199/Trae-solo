import React, { useState, useEffect } from 'react';
import { rulesApi } from '../api.js';

const categoryLabels = {
  data_privacy: '数据隐私',
  content_security: '内容安全',
  model_output: '模型输出'
};

const riskLevelLabels = {
  high: '高',
  medium: '中',
  low: '低'
};

function Rules() {
  const [rules, setRules] = useState([]);
  const [filters, setFilters] = useState({ category: '', is_active: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, [filters]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await rulesApi.getAll(params);
      if (res.data.success) {
        setRules(res.data.data);
      }
    } catch (error) {
      console.error('加载规则列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ 规则管理</h2>
      </div>

      <div className="filter-bar">
        <select 
          value={filters.category} 
          onChange={e => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">全部分类</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select 
          value={filters.is_active} 
          onChange={e => setFilters({ ...filters, is_active: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="true">已激活</option>
          <option value="false">已停用</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : rules.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>规则名称</th>
                <th>分类</th>
                <th>版本</th>
                <th>风险等级</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td><span className="tag">{categoryLabels[r.category] || r.category}</span></td>
                  <td>{r.version}</td>
                  <td><span className={`status-badge risk-${r.risk_level}`}>{riskLevelLabels[r.risk_level]}</span></td>
                  <td>
                    <span className={`status-badge ${r.is_active ? 'status-completed' : 'status-rejected'}`}>
                      {r.is_active ? '已激活' : '已停用'}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无规则记录</div>
        )}
      </div>

      <div className="card">
        <h3>规则说明</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {rules.map(r => (
            <div key={r.id} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{r.name}</div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>{r.description}</div>
              <div style={{ fontSize: '12px' }}>
                <span className="tag">v{r.version}</span>
                <span className={`status-badge risk-${r.risk_level}`}>{riskLevelLabels[r.risk_level]}风险</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Rules;
