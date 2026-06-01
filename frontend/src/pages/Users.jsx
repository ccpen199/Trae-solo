import React, { useState, useEffect } from 'react';
import { userAPI, appAPI } from '../utils/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'developer' });
  const [permForm, setPermForm] = useState({ app_id: '', resource_type: 'config', action: 'read' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, appRes] = await Promise.all([
        userAPI.list(),
        appAPI.list()
      ]);
      setUsers(userRes.data);
      setApps(appRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await userAPI.create(form);
      setShowModal(false);
      setForm({ username: '', password: '', name: '', email: '', role: 'developer' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleGrantPermission = async (e) => {
    e.preventDefault();
    try {
      await userAPI.grantPermission(selectedUser.id, permForm);
      const res = await userAPI.get(selectedUser.id);
      setSelectedUser(res.data);
      setPermForm({ app_id: '', resource_type: 'config', action: 'read' });
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const loadUserDetail = async (user) => {
    try {
      const res = await userAPI.get(user.id);
      setSelectedUser(res.data);
    } catch (err) {
      console.error('加载用户详情失败:', err);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="filter-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 创建用户</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>用户列表</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>角色</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={selectedUser?.id === u.id ? 'bg-blue-50' : ''}>
                  <td><code>{u.username}</code></td>
                  <td>{u.name}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-default'}`}>
                      {u.status === 'active' ? '正常' : '停用'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => loadUserDetail(u)}>
                      权限设置
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>权限配置</h3>
          </div>
          {!selectedUser ? (
            <div className="empty-state">
              <div className="empty-state-icon">👆</div>
              <div className="empty-state-text">请选择一个用户配置权限</div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                <strong>{selectedUser.name}</strong>
                <span className={`role-badge role-${selectedUser.role}`} style={{ marginLeft: 8 }}>
                  {RoleLabel(selectedUser.role)}
                </span>
              </div>

              <form onSubmit={handleGrantPermission} style={{ marginBottom: 20 }}>
                <div className="detail-grid">
                  <div className="form-group">
                    <label>应用</label>
                    <select value={permForm.app_id} onChange={(e) => setPermForm({ ...permForm, app_id: e.target.value })}>
                      <option value="">全部应用</option>
                      {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>资源类型</label>
                    <select value={permForm.resource_type} onChange={(e) => setPermForm({ ...permForm, resource_type: e.target.value })}>
                      <option value="config">配置</option>
                      <option value="task">任务</option>
                      <option value="application">应用</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>动作</label>
                    <select value={permForm.action} onChange={(e) => setPermForm({ ...permForm, action: e.target.value })}>
                      <option value="read">读取</option>
                      <option value="write">写入</option>
                      <option value="execute">执行</option>
                      <option value="create">创建</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary">授权</button>
                  </div>
                </div>
              </form>

              <h4 style={{ marginBottom: 12 }}>已有权限</h4>
              {selectedUser.permissions?.length === 0 ? (
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>暂无权限配置（管理员默认拥有所有权限）</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedUser.permissions?.map(p => (
                    <span key={p.id} className="badge badge-info" style={{ padding: '6px 12px' }}>
                      {p.app_name || '全部应用'} - {p.resource_type}:{p.action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建用户</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="detail-grid">
                  <div className="form-group">
                    <label>用户名 *</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="至少3个字符"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>角色 *</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">系统管理员</option>
                      <option value="developer">开发者</option>
                      <option value="operator">运维</option>
                      <option value="owner">应用负责人</option>
                      <option value="security">安全管理员</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>姓名 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>密码 *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="至少6个字符"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const RoleBadge = ({ role }) => {
  return <span className={`role-badge role-${role}`}>{RoleLabel(role)}</span>;
};

const RoleLabel = (role) => {
  const map = {
    admin: '系统管理员',
    developer: '开发者',
    operator: '运维',
    owner: '应用负责人',
    security: '安全管理员'
  };
  return map[role] || role;
};

export default Users;
