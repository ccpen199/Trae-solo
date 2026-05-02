import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function UsersPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '', organizationId: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferData, setTransferData] = useState({
    newOrganizationId: '',
    newRoleId: '',
    reason: ''
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    realName: '',
    phone: '',
    organizationId: '',
    roles: [],
    initialPassword: ''
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
    fetchRoles();
  }, [pagination.page, pagination.pageSize]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);

      const response = await api.get(`/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.data.list || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      showAlert('error', '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      if (response.data.success) {
        setOrganizations(response.data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch organizations error:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      if (response.data.success) {
        setRoles(response.data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch roles error:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge success';
      case 'inactive':
        return 'status-badge failed';
      case 'pending':
        return 'status-badge medium';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '已入驻';
      case 'inactive':
        return '已禁用';
      case 'pending':
        return '待激活';
      default:
        return status;
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          realName: formData.realName,
          email: formData.email,
          phone: formData.phone,
          organizationId: formData.organizationId || undefined,
          roles: formData.roles.length > 0 ? formData.roles : undefined
        });
        showAlert('success', '用户更新成功');
      } else {
        if (!formData.initialPassword) {
          showAlert('error', '初始密码不能为空');
          return;
        }
        await api.post('/users', {
          username: formData.username,
          realName: formData.realName,
          email: formData.email,
          phone: formData.phone,
          organizationId: formData.organizationId || undefined,
          roles: formData.roles.length > 0 ? formData.roles : undefined,
          initialPassword: formData.initialPassword
        });
        showAlert('success', '用户创建成功，状态为"待激活"');
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      showAlert('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      realName: user.realName || '',
      phone: user.phone || '',
      organizationId: user.organizationId || '',
      roles: user.roles || [],
      initialPassword: ''
    });
    setShowModal(true);
  };

  const handleResetPassword = async (user) => {
    if (window.confirm(`确定要重置用户 "${user.username}" 的密码吗？`)) {
      try {
        const tempPassword = 'Temp@123456';
        await api.put(`/users/${user.id}/reset-password`, {
          newPassword: tempPassword
        });
        showAlert('success', `密码已重置为: ${tempPassword}`);
      } catch (error) {
        console.error('Reset password error:', error);
        showAlert('error', '操作失败');
      }
    }
  };

  const handleTransfer = (user) => {
    setSelectedUser(user);
    setTransferData({
      newOrganizationId: user.organizationId || '',
      newRoleId: '',
      reason: ''
    });
    setShowTransferModal(true);
  };

  const confirmTransfer = async () => {
    try {
      await api.post(`/users/${selectedUser.id}/transfer`, {
        newOrganizationId: transferData.newOrganizationId || undefined,
        comment: transferData.reason
      });
      setShowTransferModal(false);
      fetchUsers();
      showAlert('success', '岗位变动处理完成，权限已自动清理');
    } catch (error) {
      console.error('Transfer error:', error);
      showAlert('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleCleanupPermissions = async (user) => {
    if (window.confirm(`确定要回收用户 "${user.username}" 的所有关联应用权限吗？`)) {
      try {
        await api.post(`/users/${user.id}/cleanup-permissions`);
        fetchUsers();
        showAlert('success', '权限回收完成');
      } catch (error) {
        console.error('Cleanup permissions error:', error);
        showAlert('error', '操作失败');
      }
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (window.confirm(`确定要将用户 "${user.username}" 状态改为 "${getStatusText(newStatus)}" 吗？`)) {
      try {
        await api.put(`/users/${user.id}`, {
          status: newStatus
        });
        fetchUsers();
        showAlert('success', '状态更新成功');
      } catch (error) {
        console.error('Update status error:', error);
        showAlert('error', '操作失败');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      realName: '',
      phone: '',
      organizationId: '',
      roles: [],
      initialPassword: ''
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const handleRoleChange = (roleId) => {
    setFormData(prev => {
      const roles = prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId];
      return { ...prev, roles };
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>用户管理</h1>
        <p>管理系统用户，支持账号创建、编辑、岗位变动等操作</p>
      </div>
      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="搜索用户名、姓名、邮箱..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="filter-select"
            value={filters.organizationId}
            onChange={(e) => setFilters({ ...filters, organizationId: e.target.value })}
          >
            <option value="">全部组织</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="active">已入驻</option>
            <option value="pending">待激活</option>
            <option value="inactive">已禁用</option>
          </select>
          <button className="filter-btn" onClick={handleSearch}>搜索</button>
          {hasPermission('user:write') && (
            <button
              className="filter-btn"
              onClick={() => {
                setEditingUser(null);
                resetForm();
                setShowModal(true);
              }}
            >
              + 新增用户
            </button>
          )}
        </div>

        <div className="section">
          <h3 className="section-title">用户列表 ({pagination.total})</h3>
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner-large"></div>
              <p style={{ marginTop: '16px' }}>加载中...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>用户名</th>
                      <th>姓名</th>
                      <th>邮箱</th>
                      <th>组织</th>
                      <th>状态</th>
                      <th>最后登录</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td><strong>{user.username}</strong></td>
                        <td>{user.realName || '-'}</td>
                        <td>{user.email || '-'}</td>
                        <td>{user.organizationName || '-'}</td>
                        <td>
                          <span className={getStatusBadge(user.status)}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td>{formatTime(user.lastLoginAt)}</td>
                        <td>
                          {hasPermission('user:write') && (
                            <>
                              <button className="action-btn" onClick={() => handleEdit(user)}>编辑</button>
                              <button className="action-btn" onClick={() => handleToggleStatus(user)}>
                                {user.status === 'active' ? '禁用' : '启用'}
                              </button>
                              <button className="action-btn" onClick={() => handleTransfer(user)}>调岗</button>
                              <button className="action-btn" onClick={() => handleResetPassword(user)}>重置密码</button>
                              <button className="action-btn danger" onClick={() => handleCleanupPermissions(user)}>回收权限</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: '16px' }}>
                  <button
                    className="pagination-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >
                    上一页
                  </button>
                  <span className="pagination-info">
                    第 {pagination.page} / {totalPages} 页，共 {pagination.total} 条
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={pagination.page >= totalPages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p>暂无用户数据</p>
            </div>
          )}
        </div>

        <div className="alert alert-info">
          <strong>功能说明</strong>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            用户管理支持完整的身份生命周期：
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>创建用户：后端生成唯一身份标识，状态为"待激活"</li>
            <li>账号激活：员工通过前端激活，状态变更为"已入驻"</li>
            <li>岗位变动：自动清理旧权限，推送变更报告到审计端</li>
            <li>权限回收：一键回收用户所有关联应用权限</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? '编辑用户' : '新增用户'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>用户名 *</label>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ width: '100%', height: '40px' }}
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editingUser}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>姓名</label>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ width: '100%', height: '40px' }}
                    placeholder="请输入姓名"
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    className="filter-input"
                    style={{ width: '100%', height: '40px' }}
                    placeholder="请输入邮箱"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>手机号</label>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ width: '100%', height: '40px' }}
                    placeholder="请输入手机号"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>所属组织</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', height: '40px' }}
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  >
                    <option value="">请选择组织</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>角色</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {roles.map(role => (
                      <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role.id)}
                          onChange={() => handleRoleChange(role.id)}
                        />
                        <span>{role.displayName || role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label>初始密码 *</label>
                    <input
                      type="password"
                      className="filter-input"
                      style={{ width: '100%', height: '40px' }}
                      placeholder="请输入初始密码"
                      value={formData.initialPassword}
                      onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                      required
                    />
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      用户首次登录后需修改密码
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="filter-btn"
                >
                  {editingUser ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>岗位变动</h3>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <strong>注意：</strong>岗位变动将自动回收用户原有权限，并记录岗位变更历史。
              </div>
              <div className="form-group">
                <label>当前用户</label>
                <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {selectedUser.realName || selectedUser.username} ({selectedUser.username})
                </div>
              </div>
              <div className="form-group">
                <label>新组织</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', height: '40px' }}
                  value={transferData.newOrganizationId}
                  onChange={(e) => setTransferData({ ...transferData, newOrganizationId: e.target.value })}
                >
                  <option value="">请选择新组织（可选）</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>变动原因</label>
                <textarea
                  className="filter-input"
                  style={{ width: '100%', minHeight: '80px', padding: '10px' }}
                  placeholder="请输入变动原因（可选）"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTransferModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="filter-btn"
                onClick={confirmTransfer}
              >
                确认变动
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
