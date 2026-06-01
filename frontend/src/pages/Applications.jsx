import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formData, setFormData] = useState({ app_name: '', description: '', owner_id: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [environments, setEnvironments] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadApplications();
    loadUsers();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      const res = await api.get('/applications', { params: { status: filterStatus } });
      setApplications(res.data.list);
    } catch (err) {
      console.error('加载应用失败', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/audit/users');
      setUsers(res.data);
    } catch (err) {
      console.error('加载用户失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedApp) {
        await api.put(`/applications/${selectedApp.id}`, formData);
      } else {
        await api.post('/applications', formData);
      }
      loadApplications();
      setShowModal(false);
      setFormData({ app_name: '', description: '', owner_id: '' });
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app) => {
    setSelectedApp(app);
    setFormData({ app_name: app.app_name, description: app.description, owner_id: app.owner_id });
    setShowModal(true);
  };

  const handleView = async (app) => {
    setSelectedApp(app);
    setActiveTab('info');
    try {
      const [envRes, keyRes] = await Promise.all([
        api.get(`/applications/${app.id}/environments`),
        api.get(`/applications/${app.id}/api-keys`)
      ]);
      setEnvironments(envRes.data);
      setApiKeys(keyRes.data);
    } catch (err) {
      console.error('加载详情失败', err);
    }
    setShowModal(true);
  };

  const addEnvironment = async () => {
    const envName = prompt('请输入环境名称：');
    if (!envName) return;
    const envType = prompt('请输入环境类型（dev/test/prod）：', 'dev');
    try {
      await api.post(`/applications/${selectedApp.id}/environments`, { env_name: envName, env_type: envType });
      const res = await api.get(`/applications/${selectedApp.id}/environments`);
      setEnvironments(res.data);
    } catch (err) {
      alert(err.response?.data?.error || '创建环境失败');
    }
  };

  const addApiKey = async () => {
    const keyName = prompt('请输入密钥名称：');
    if (!keyName) return;
    try {
      const res = await api.post(`/applications/${selectedApp.id}/api-keys`, { key_name: keyName });
      alert(`创建成功！API Key: ${res.data.api_key}\n请妥善保存，只显示一次！`);
      const keyRes = await api.get(`/applications/${selectedApp.id}/api-keys`);
      setApiKeys(keyRes.data);
    } catch (err) {
      alert(err.response?.data?.error || '创建密钥失败');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📱 应用管理</h2>
          <button className="btn btn-primary" onClick={() => { setSelectedApp(null); setFormData({ app_name: '', description: '', owner_id: '' }); setShowModal(true); }}>
            + 新增应用
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">全部</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>应用ID</th>
              <th>应用名称</th>
              <th>负责人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.app_id}</td>
                <td>{app.app_name}</td>
                <td>{app.owner_name}</td>
                <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                <td>{app.created_at}</td>
                <td>
                  <button className="btn btn-default" style={{ marginRight: 8 }} onClick={() => handleView(app)}>查看</button>
                  <button className="btn btn-success" style={{ marginRight: 8 }} onClick={() => navigate(`/applications/${app.id}/lowcode`)}>🛠️ 低代码</button>
                  <button className="btn btn-primary" onClick={() => handleEdit(app)}>编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedApp && activeTab ? '应用详情' : (selectedApp ? '编辑应用' : '新增应用')}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedApp && activeTab ? (
                <>
                  <div className="tabs">
                    <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
                    <div className={`tab ${activeTab === 'env' ? 'active' : ''}`} onClick={() => setActiveTab('env')}>环境配置</div>
                    <div className={`tab ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab('keys')}>API密钥</div>
                  </div>

                  {activeTab === 'info' && (
                    <div>
                      <p><strong>应用ID：</strong>{selectedApp.app_id}</p>
                      <p><strong>应用名称：</strong>{selectedApp.app_name}</p>
                      <p><strong>状态：</strong><span className={`status-badge status-${selectedApp.status}`}>{selectedApp.status}</span></p>
                      <p><strong>创建时间：</strong>{selectedApp.created_at}</p>
                    </div>
                  )}

                  {activeTab === 'env' && (
                    <div>
                      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={addEnvironment}>+ 添加环境</button>
                      <table>
                        <thead>
                          <tr>
                            <th>环境名称</th>
                            <th>环境类型</th>
                            <th>创建时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {environments.map(env => (
                            <tr key={env.id}>
                              <td>{env.env_name}</td>
                              <td>{env.env_type}</td>
                              <td>{env.created_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'keys' && (
                    <div>
                      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={addApiKey}>+ 生成密钥</button>
                      <table>
                        <thead>
                          <tr>
                            <th>密钥名称</th>
                            <th>API Key</th>
                            <th>状态</th>
                            <th>创建人</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiKeys.map(key => (
                            <tr key={key.id}>
                              <td>{key.key_name}</td>
                              <td>{key.api_key}</td>
                              <td><span className={`status-badge status-${key.status}`}>{key.status}</span></td>
                              <td>{key.creator_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">应用名称</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.app_name}
                      onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">负责人</label>
                    <select
                      className="form-select"
                      value={formData.owner_id}
                      onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                    >
                      <option value="">请选择</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? '提交中...' : '提交'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
