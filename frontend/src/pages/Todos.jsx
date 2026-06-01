import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { todoAPI, userAPI } from '../api';

const Todos = () => {
  const { user, hasRole } = useAuth();
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'normal',
    due_date: '',
    status: 'pending'
  });

  const priorityLabels = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  };

  const statusLabels = {
    pending: '待处理',
    in_progress: '进行中',
    done: '已完成'
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const params = { ...filters };
      const [res, usersRes] = await Promise.all([
        todoAPI.getMyTodos(params),
        hasRole('admin') ? userAPI.getUsers({ role: 'psychologist,teacher' }) : Promise.resolve({ data: [] })
      ]);
      setTodos(res.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Load todos error:', error);
    }
  };

  const handleCreate = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      assignee_id: user.id,
      priority: 'normal',
      due_date: '',
      status: 'pending'
    });
    setShowModal(true);
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
      assignee_id: todo.assignee_id,
      priority: todo.priority,
      due_date: todo.due_date ? todo.due_date.slice(0, 16) : '',
      status: todo.status
    });
    setShowModal(true);
  };

  const handleStatusChange = async (todo, newStatus) => {
    try {
      await todoAPI.updateTodo(todo.id, { status: newStatus });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '更新失败');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个待办事项吗？')) return;
    try {
      await todoAPI.deleteTodo(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTodo) {
        await todoAPI.updateTodo(editingTodo.id, formData);
      } else {
        await todoAPI.createTodo(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: 'badge-urgent',
      high: 'badge-high',
      normal: 'badge-pending',
      low: 'badge-normal'
    };
    return <span className={`badge ${badges[priority]}`}>{priorityLabels[priority]}</span>;
  };

  if (!hasRole('admin', 'psychologist', 'teacher')) {
    return <div className="card"><p>权限不足</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>待办事项</h1>
        <button className="btn btn-sm" onClick={handleCreate}>+ 新建待办</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="normal">普通</option>
            <option value="low">低</option>
          </select>
        </div>

        {todos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>暂无待办事项</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>描述</th>
                <th>优先级</th>
                <th>状态</th>
                <th>截止时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {todos.map(todo => (
                <tr key={todo.id}>
                  <td>{todo.title}</td>
                  <td>{todo.description?.substring(0, 30) || '-'}</td>
                  <td>{getPriorityBadge(todo.priority)}</td>
                  <td>
                    <select
                      value={todo.status}
                      onChange={(e) => handleStatusChange(todo, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                    >
                      <option value="pending">待处理</option>
                      <option value="in_progress">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                  </td>
                  <td>{todo.due_date ? new Date(todo.due_date).toLocaleString() : '-'}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(todo)}>编辑</button>
                    {hasRole('admin', 'psychologist') && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(todo.id)}>删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTodo ? '编辑待办' : '新建待办'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              {hasRole('admin') && (
                <div className="form-group">
                  <label>指派给</label>
                  <select
                    value={formData.assignee_id}
                    onChange={(e) => setFormData({ ...formData, assignee_id: parseInt(e.target.value) })}
                    required
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-2">
                <div className="form-group">
                  <label>优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="normal">普通</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>截止时间</label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn">
                {editingTodo ? '保存修改' : '创建待办'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todos;
