import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';

function Applications() {
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    app_code: '',
    app_name: '',
    description: '',
    category: 'web',
    owner_id: '',
    tech_stack: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsRes, usersRes] = await Promise.all([
        apiService.getApplications(),
        apiService.getUsers()
      ]);
      setApplications(appsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createApplication(formData);
      setShowModal(false);
      setFormData({
        app_code: '',
        app_name: '',
        description: '',
        category: 'web',
        owner_id: '',
        tech_stack: ''
      });
      loadData();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">应用管理</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => apiService.exportData('applications')}>
            <Download size={16} /> 导出
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> 新建应用
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>应用编码</th>
                <th>应用名称</th>
                <th>分类</th>
                <th>负责人</th>
                <th>技术栈</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td><code>{app.app_code}</code></td>
                  <td>{app.app_name}</td>
                  <td>{app.category}</td>
                  <td>{app.owner_name || '-'}</td>
                  <td>{app.tech_stack || '-'}</td>
                  <td>
                    <span className={`badge badge-${app.status === 'active' ? 'active' : 'inactive'}`}>
                      {app.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td>{new Date(app.created_at).toLocaleString()}</td>
                  <td>
                    <Link to={`/applications/${app.id}`} className="link-text">详情</Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">暂无应用数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建应用</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>应用编码 *</label>
                    <input 
                      type="text" 
                      value={formData.app_code}
                      onChange={e => setFormData({...formData, app_code: e.target.value})}
                      placeholder="如：APP001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>应用名称 *</label>
                    <input 
                      type="text" 
                      value={formData.app_name}
                      onChange={e => setFormData({...formData, app_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>分类</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="web">Web应用</option>
                      <option value="service">后端服务</option>
                      <option value="mobile">移动端</option>
                      <option value="desktop">桌面应用</option>
                      <option value="middleware">中间件</option>
                      <option value="database">数据库</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>负责人</label>
                    <select 
                      value={formData.owner_id}
                      onChange={e => setFormData({...formData, owner_id: e.target.value})}
                    >
                      <option value="">请选择</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>技术栈</label>
                  <input 
                    type="text" 
                    value={formData.tech_stack}
                    onChange={e => setFormData({...formData, tech_stack: e.target.value})}
                    placeholder="如：React, Node.js, MySQL"
                  />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea 
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
