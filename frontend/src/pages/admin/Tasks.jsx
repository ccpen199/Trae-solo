import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminTasks({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    task_type: '',
    keyword: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/admin/tasks?${params.toString()}`);
      setTasks(response.data.data || []);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('确定要删除此任务吗？')) return;
    
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      showToast('任务已删除', 'success');
      loadTasks();
    } catch (error) {
      showToast(error.response?.data?.error || '删除失败', 'error');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待审核',
      published: '已发布',
      in_progress: '进行中',
      completed: '已完成',
      rejected: '已驳回',
      cancelled: '已取消'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      published: 'badge-success',
      in_progress: 'badge-info',
      completed: 'badge-success',
      rejected: 'badge-danger',
      cancelled: 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  };

  const getTypeLabel = (type) => {
    const labels = { online: '线上任务', offline: '线下任务', hybrid: '混合任务' };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>任务管理</h1>
      
      <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              placeholder="搜索任务名称..."
            />
          </div>
          <select
            className="form-select"
            name="status"
            value={filters.status}
            onChange={handleChange}
            style={{ width: '160px' }}
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="published">已发布</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已驳回</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            className="form-select"
            name="task_type"
            value={filters.task_type}
            onChange={handleChange}
            style={{ width: '160px' }}
          >
            <option value="">全部类型</option>
            <option value="online">线上任务</option>
            <option value="offline">线下任务</option>
            <option value="hybrid">混合任务</option>
          </select>
        </div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>任务名称</th>
              <th>类型</th>
              <th>分类</th>
              <th>预算</th>
              <th>雇主</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </td>
                <td>
                  <span className={`task-type task-type-${task.task_type}`}>
                    {getTypeLabel(task.task_type)}
                  </span>
                </td>
                <td>{task.category}</td>
                <td style={{ fontWeight: 600, color: '#667eea' }}>¥{task.budget}</td>
                <td>{task.company_name || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#64748b' }}>
                  {task.created_at?.substring(0, 16)}
                </td>
                <td>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                    onClick={() => handleDelete(task.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTasks;
