import React, { useState, useEffect } from 'react';
import { todosAPI } from '../api';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    loadTodos();
  }, [filter]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await todosAPI.getAll({ status: filter });
      setTodos(res.data || []);
    } catch (error) {
      console.error('加载待办失败:', error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, status) => {
    setActionId(id);
    try {
      await todosAPI.update(id, { status });
      alert('状态更新成功！');
      loadTodos();
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新失败，请重试');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条待办事项吗？')) return;
    setActionId(id);
    try {
      await todosAPI.delete(id);
      alert('删除成功！');
      loadTodos();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setActionId(null);
    }
  };

  const getTypeText = (type) => {
    const map = { followup: '跟进提醒', material: '材料补正', rejected: '异议驳回处理', other: '其他' };
    return map[type] || type;
  };

  const getTypeBadgeClass = (type) => {
    const map = { followup: 'status-processing', material: 'status-pending', rejected: 'status-rejected', other: 'status-active' };
    return `status-badge ${map[type] || 'status-pending'}`;
  };

  return (
    <div>
      <h2>待办事项</h2>

      <div className="filter-bar">
        <span>状态筛选：</span>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="pending">待处理</option>
          <option value="completed">已完成</option>
          <option value="">全部</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>类型</th>
              <th>标题</th>
              <th>描述</th>
              <th>关联客户</th>
              <th>截止时间</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {todos.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">暂无待办事项</td></tr>
            ) : (
              todos.map(t => (
                <tr key={t.id}>
                  <td><span className={getTypeBadgeClass(t.type)}>{getTypeText(t.type)}</span></td>
                  <td>{t.title}</td>
                  <td>{t.description || '-'}</td>
                  <td>{t.customer_name || '-'}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(t.id, 'completed')} style={{ marginRight: '5px' }} disabled={actionId === t.id}>
                        {actionId === t.id ? '处理中...' : '完成'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)} disabled={actionId === t.id}>
                      {actionId === t.id ? '处理中...' : '删除'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Todos;
