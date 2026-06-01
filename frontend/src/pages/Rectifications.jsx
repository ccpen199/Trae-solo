import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rectificationsApi } from '../api.js';

const statusLabels = {
  pending: '待开始',
  in_progress: '进行中',
  submitted: '待复核',
  approved: '已通过',
  rejected: '已驳回'
};

function Rectifications() {
  const [rectifications, setRectifications] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    assignee_id: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRectifications();
  }, [filters]);

  const loadRectifications = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await rectificationsApi.getAll(params);
      if (res.data.success) {
        setRectifications(res.data.data);
      }
    } catch (error) {
      console.error('加载整改列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>✅ 整改跟踪</h2>
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
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : rectifications.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>整改内容</th>
                <th>关联风险</th>
                <th>负责人</th>
                <th>状态</th>
                <th>截止日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rectifications.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.risk_title || '-'}</td>
                  <td>{r.assignee_name || '-'}</td>
                  <td><span className={`status-badge status-${r.status}`}>{statusLabels[r.status]}</span></td>
                  <td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '-'}</td>
                  <td><Link to={`/rectifications/${r.id}`} className="link">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无整改任务</div>
        )}
      </div>
    </div>
  );
}

export default Rectifications;
