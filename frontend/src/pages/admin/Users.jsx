import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'frozen' : 'active';
    if (!confirm(`确定要${newStatus === 'frozen' ? '冻结' : '解冻'}用户 ${user.username} 吗？`)) {
      return;
    }

    try {
      await adminAPI.updateUserStatus(user.id, newStatus);
      loadUsers();
    } catch (err) {
      alert('操作失败');
    }
  };

  const roleLabels = {
    admin: '⚙️ 管理员',
    hr: '🏢 企业HR',
    jobseeker: '👤 求职者',
  };

  const statusLabels = {
    active: { label: '正常', color: 'success' },
    frozen: { label: '已冻结', color: 'danger' },
    pending: { label: '待审核', color: 'warning' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin" className="text-sm text-secondary" style={{ marginBottom: 8, display: 'block' }}>
            ← 返回控制台
          </Link>
          <h1 className="page-title">👥 用户管理</h1>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div className="grid-4" style={{ gap: 12 }}>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">全部角色</option>
            <option value="jobseeker">求职者</option>
            <option value="hr">企业HR</option>
            <option value="admin">管理员</option>
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="frozen">已冻结</option>
            <option value="pending">待审核</option>
          </select>
          <button className="btn btn-secondary" onClick={loadUsers}>🔄 刷新</button>
          <div></div>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>暂无用户</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>用户名</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>邮箱</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>手机</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>角色</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>状态</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>注册时间</th>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 16, fontSize: 14 }}>{user.id}</td>
                  <td style={{ padding: 16, fontSize: 14, fontWeight: 500 }}>{user.username}</td>
                  <td style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)' }}>{user.phone || '-'}</td>
                  <td style={{ padding: 16, fontSize: 14 }}>{roleLabels[user.role]}</td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <span className={`badge badge-${statusLabels[user.status]?.color}`}>
                      {statusLabels[user.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {user.created_at?.replace('T', ' ').substring(0, 16)}
                  </td>
                  <td style={{ padding: 16 }}>
                    {user.role !== 'admin' && (
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.status === 'active' ? '冻结' : '解冻'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
