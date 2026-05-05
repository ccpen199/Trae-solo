import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';
import { genderLabels, roleLabels } from '../utils/validation';
import Layout from '../components/Layout';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    username: '',
    role: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll(filters);
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setMessage({ type: 'error', text: error.message || '获取用户列表失败' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isAdmin) {
        navigate('/user');
        return;
      }
      fetchUsers();
    }
  }, [user, isAdmin, authLoading, navigate, fetchUsers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleReset = () => {
    setFilters({ username: '', role: '' });
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchUsers();
    }
  }, [filters.username, filters.role, authLoading, user, isAdmin, fetchUsers]);

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    setDeletingId(userId);
    setMessage({ type: '', text: '' });
    
    try {
      await userApi.delete(userId);
      setMessage({ type: 'success', text: `用户 "${username}" 已成功删除` });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '删除用户失败' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'admin' : 'user';
  };

  if (authLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <Layout>
      <div className="page-content">
        <div className="container">
          <div className="page-title">
            <h2>用户管理工作台</h2>
            <p>管理系统中的所有用户，支持查询和删除操作</p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>总用户数</h3>
              <div className="stat-value">{totalUsers}</div>
            </div>
            <div className="stat-card">
              <h3>管理员数</h3>
              <div className="stat-value" style={{ color: '#ff4d4f' }}>{adminCount}</div>
            </div>
            <div className="stat-card">
              <h3>普通用户数</h3>
              <div className="stat-value" style={{ color: '#1890ff' }}>{userCount}</div>
            </div>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
              {message.text}
            </div>
          )}

          <div className="table-container">
            <div className="table-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>用户列表</h3>
              
              <form onSubmit={handleSearch} className="table-filters">
                <input
                  type="text"
                  name="username"
                  value={filters.username}
                  onChange={handleFilterChange}
                  className="form-control"
                  placeholder="搜索用户名..."
                />
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">全部角色</option>
                  <option value="admin">管理员</option>
                  <option value="user">普通用户</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  搜索
                </button>
                <button 
                  type="button" 
                  className="btn btn-default"
                  onClick={handleReset}
                >
                  重置
                </button>
              </form>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="table-responsive">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <h3>暂无用户数据</h3>
                    <p>调整搜索条件或稍后再试</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>用户名</th>
                        <th>角色</th>
                        <th>年龄</th>
                        <th>性别</th>
                        <th>注册时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>
                            <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                              {roleLabels[u.role]}
                            </span>
                          </td>
                          <td>{u.age ?? '-'}</td>
                          <td>{u.gender ? genderLabels[u.gender] : '-'}</td>
                          <td>{formatDate(u.created_at)}</td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(u.id, u.username)}
                              disabled={deletingId === u.id || u.id === user?.id}
                            >
                              {deletingId === u.id ? '删除中...' : 
                               u.id === user?.id ? '不能删除自己' : '删除'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
