import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminUsers({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_type: '',
    verification_status: '',
    keyword: ''
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data || []);
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

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';
    
    if (!window.confirm(`确定要${action}此用户吗？`)) return;
    
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      showToast(`用户已${action}`, 'success');
      loadUsers();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      student: '在校学生',
      homemaker: '居家宝妈',
      parttime: '兼职上班族',
      employer: '企业雇主',
      admin: '平台管理员'
    };
    return labels[type] || type;
  };

  const getVerificationLabel = (status) => {
    const labels = {
      unverified: '未认证',
      pending: '待审核',
      verified: '已认证',
      rejected: '已驳回'
    };
    return labels[status] || status;
  };

  const getVerificationBadgeClass = (status) => {
    const classes = {
      unverified: 'badge-secondary',
      pending: 'badge-warning',
      verified: 'badge-success',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'badge-success' : 'badge-danger';
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>用户管理</h1>
      
      <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              placeholder="搜索用户名/手机号..."
            />
          </div>
          <select
            className="form-select"
            name="user_type"
            value={filters.user_type}
            onChange={handleChange}
            style={{ width: '160px' }}
          >
            <option value="">全部类型</option>
            <option value="student">在校学生</option>
            <option value="homemaker">居家宝妈</option>
            <option value="parttime">兼职上班族</option>
            <option value="employer">企业雇主</option>
          </select>
          <select
            className="form-select"
            name="verification_status"
            value={filters.verification_status}
            onChange={handleChange}
            style={{ width: '160px' }}
          >
            <option value="">全部认证状态</option>
            <option value="unverified">未认证</option>
            <option value="pending">待审核</option>
            <option value="verified">已认证</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>昵称</th>
              <th>用户类型</th>
              <th>手机号</th>
              <th>信用分</th>
              <th>认证状态</th>
              <th>账号状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.username}</td>
                <td>{user.nickname || '-'}</td>
                <td>
                  <span className="badge badge-info">{getTypeLabel(user.user_type)}</span>
                </td>
                <td>{user.phone || '-'}</td>
                <td style={{ fontWeight: 600, color: '#f59e0b' }}>
                  {user.credit_score || 80}
                </td>
                <td>
                  <span className={`badge ${getVerificationBadgeClass(user.verification_status)}`}>
                    {getVerificationLabel(user.verification_status)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                    {user.status === 'active' ? '正常' : '已禁用'}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#64748b' }}>
                  {user.created_at?.substring(0, 16)}
                </td>
                <td>
                  {user.user_type !== 'admin' && (
                    <button 
                      className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '6px 16px', fontSize: '13px' }}
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === 'active' ? '禁用' : '启用'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
