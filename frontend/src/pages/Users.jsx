import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';

const Users = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({ role: '', grade: '' });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'student',
    grade: '',
    class: ''
  });

  const roleLabels = {
    admin: '系统管理员',
    psychologist: '心理老师',
    teacher: '班主任',
    student: '学生'
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getUsers(filters);
      setUsers(res.data);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'student',
      grade: '',
      class: ''
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      grade: user.grade || '',
      class: user.class || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个用户吗？')) return;
    try {
      await userAPI.deleteUser(id);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userAPI.updateUser(editingUser.id, updateData);
      } else {
        await userAPI.createUser(formData);
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  if (!hasRole('admin')) {
    return <div className="card"><p>权限不足</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>用户管理</h1>
        <button className="btn btn-sm" onClick={handleCreate}>+ 新建用户</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">全部角色</option>
            <option value="admin">系统管理员</option>
            <option value="psychologist">心理老师</option>
            <option value="teacher">班主任</option>
            <option value="student">学生</option>
          </select>
          <select
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
          >
            <option value="">全部年级</option>
            {[7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={g}>{g}年级</option>
            ))}
          </select>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>暂无用户</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>角色</th>
                <th>年级</th>
                <th>班级</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.name}</td>
                  <td><span className="badge badge-pending">{roleLabels[user.role]}</span></td>
                  <td>{user.grade || '-'}</td>
                  <td>{user.class || '-'}</td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(user)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>删除</button>
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
              <h2>{editingUser ? '编辑用户' : '新建用户'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="form-group">
                <label>密码 {editingUser && '(留空不修改)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="admin">系统管理员</option>
                  <option value="psychologist">心理老师</option>
                  <option value="teacher">班主任</option>
                  <option value="student">学生</option>
                </select>
              </div>
              {(formData.role === 'student' || formData.role === 'teacher') && (
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>年级</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    >
                      <option value="">请选择</option>
                      {[7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={g}>{g}年级</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>班级</label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      placeholder="如：1班"
                    />
                  </div>
                </div>
              )}
              <button type="submit" className="btn">
                {editingUser ? '保存修改' : '创建用户'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
