import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Plus } from 'lucide-react';

function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [formData, setFormData] = useState({
    user_id: '',
    resource_type: 'application',
    resource_id: '',
    action: 'read',
    valid_from: '',
    valid_until: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [permRes, usersRes, auditRes] = await Promise.all([
        apiService.getPermissions(),
        apiService.getUsers(),
        apiService.getPermissionAudit()
      ]);
      setPermissions(permRes.data);
      setUsers(usersRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createPermission(formData);
      setShowModal(false);
      setFormData({
        user_id: '',
        resource_type: 'application',
        resource_id: '',
        action: 'read',
        valid_from: '',
        valid_until: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">权限管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> 授予权限
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>权限列表</button>
        <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>审计日志</button>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>资源类型</th>
                  <th>资源ID</th>
                  <th>操作</th>
                  <th>授予人</th>
                  <th>有效期</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(p => (
                  <tr key={p.id}>
                    <td>{p.user_name}</td>
                    <td>{p.resource_type}</td>
                    <td>{p.resource_id || '-'}</td>
                    <td>{p.action}</td>
                    <td>{p.granter_name || '-'}</td>
                    <td>{p.valid_from || '-'} ~ {p.valid_until || '-'}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {permissions.length === 0 && (
                  <tr><td colSpan="7" className="empty-state">暂无权限记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>资源类型</th>
                  <th>资源ID</th>
                  <th>操作</th>
                  <th>是否允许</th>
                  <th>原因</th>
                  <th>审计时间</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.user_name}</td>
                    <td>{log.resource_type}</td>
                    <td>{log.resource_id || '-'}</td>
                    <td>{log.action}</td>
                    <td>
                      <span className={`badge ${log.allowed ? 'badge-active' : 'badge-failed'}`}>
                        {log.allowed ? '允许' : '拒绝'}
                      </span>
                    </td>
                    <td>{log.reason || '-'}</td>
                    <td>{new Date(log.audited_at).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan="7" className="empty-state">暂无审计日志</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>授予权限</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>用户 *</label>
                    <select required value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})}>
                      <option value="">请选择</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>资源类型</label>
                    <select value={formData.resource_type} onChange={e => setFormData({...formData, resource_type: e.target.value})}>
                      <option value="application">应用</option>
                      <option value="change_order">变更单</option>
                      <option value="execution_task">执行任务</option>
                      <option value="secret">密钥</option>
                      <option value="system">系统</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>资源ID</label>
                    <input value={formData.resource_id} onChange={e => setFormData({...formData, resource_id: e.target.value})} placeholder="留空表示所有资源" />
                  </div>
                  <div className="form-group">
                    <label>操作</label>
                    <select value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})}>
                      <option value="read">读取</option>
                      <option value="write">写入</option>
                      <option value="delete">删除</option>
                      <option value="execute">执行</option>
                      <option value="admin">管理</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>生效时间</label>
                    <input type="datetime-local" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>失效时间</label>
                    <input type="datetime-local" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">授予</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Permissions;
