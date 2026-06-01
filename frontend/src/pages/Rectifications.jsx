import React, { useState, useEffect } from 'react';
import { rectificationsAPI } from '../api.js';

function Rectifications() {
  const [rectifications, setRectifications] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadRectifications();
  }, [filter]);

  const loadRectifications = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await rectificationsAPI.getAll(params);
      setRectifications(res.data);
    } catch (error) {
      console.error('加载整改项失败:', error);
    }
  };

  const handleApprove = async (id) => {
    if (confirm('确认该整改已完成？')) {
      try {
        await rectificationsAPI.approve(id);
        loadRectifications();
      } catch (error) {
        console.error('审核失败:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-secondary',
      submitted: 'badge-warning',
      completed: 'badge-success'
    };
    const labels = {
      pending: '待整改',
      submitted: '待确认',
      completed: '已完成'
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{labels[status] || status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>整改管理</h1>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="form-group">
            <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="pending">待整改</option>
              <option value="submitted">待确认</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>供应商</th>
              <th>相关问题</th>
              <th>整改说明</th>
              <th>截止日期</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rectifications.map(rect => (
              <tr key={rect.id}>
                <td>{rect.supplier_name}</td>
                <td>{rect.question_text || '-'}</td>
                <td>{rect.description}</td>
                <td>{rect.deadline || '-'}</td>
                <td>{getStatusBadge(rect.status)}</td>
                <td>{rect.created_at?.split('T')[0]}</td>
                <td>
                  {rect.status === 'submitted' && (
                    <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleApprove(rect.id)}>
                      确认完成
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rectifications.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>暂无整改项</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rectifications;
