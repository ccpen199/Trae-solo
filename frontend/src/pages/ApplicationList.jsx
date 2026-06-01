import React, { useState, useEffect } from 'react';
import { appAPI, envAPI, versionAPI, configAPI } from '../api.js';

function ApplicationList() {
  const [activeTab, setActiveTab] = useState('apps');
  const [apps, setApps] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newApp, setNewApp] = useState({ app_key: '', app_name: '', description: '', category: 'business' });
  const [newEnv, setNewEnv] = useState({ env_name: '', env_type: 'dev', db_type: 'mysql', db_host: '', db_port: 3306, db_name: '', db_user: '', db_password_encrypted: '' });
  const [newVersion, setNewVersion] = useState({ version: '', description: '', script_content: '' });

  useEffect(() => {
    loadApps();
    loadUsers();
  }, []);

  const loadApps = async () => {
    try {
      const response = await appAPI.list({ pageSize: 100 });
      setApps(response.data.list);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const loadEnvs = async (appId) => {
    try {
      const response = await envAPI.list({ app_id: appId });
      setEnvs(response.data);
    } catch (error) {
      console.error('Failed to load envs:', error);
    }
  };

  const loadVersions = async (appId) => {
    try {
      const response = await versionAPI.list({ app_id: appId });
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await configAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    loadEnvs(app.id);
    loadVersions(app.id);
    setActiveTab('envs');
  };

  const handleCreateApp = async () => {
    if (!newApp.app_key || !newApp.app_name) {
      alert('请填写必填字段');
      return;
    }
    try {
      await appAPI.create(newApp);
      setShowAppModal(false);
      setNewApp({ app_key: '', app_name: '', description: '', category: 'business' });
      loadApps();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleCreateEnv = async () => {
    if (!selectedApp || !newEnv.env_name || !newEnv.db_host) {
      alert('请填写必填字段');
      return;
    }
    try {
      await envAPI.create({ ...newEnv, app_id: selectedApp.id });
      setShowEnvModal(false);
      setNewEnv({ env_name: '', env_type: 'dev', db_type: 'mysql', db_host: '', db_port: 3306, db_name: '', db_user: '', db_password_encrypted: '' });
      loadEnvs(selectedApp.id);
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedApp || !newVersion.version || !newVersion.script_content) {
      alert('请填写必填字段');
      return;
    }
    try {
      await versionAPI.create({ ...newVersion, app_id: selectedApp.id });
      setShowVersionModal(false);
      setNewVersion({ version: '', description: '', script_content: '' });
      loadVersions(selectedApp.id);
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleApproveVersion = async (versionId) => {
    try {
      await versionAPI.approve(versionId);
      loadVersions(selectedApp.id);
    } catch (error) {
      alert(error.response?.data?.error || '审核失败');
    }
  };

  const handleToggleAppStatus = async (app) => {
    try {
      await appAPI.update(app.id, { status: app.status === 'active' ? 'inactive' : 'active' });
      loadApps();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleToggleEnvStatus = async (env) => {
    try {
      await envAPI.update(env.id, { status: env.status === 'active' ? 'inactive' : 'active' });
      loadEnvs(selectedApp.id);
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="tabs">
          <div className={`tab-item ${activeTab === 'apps' ? 'active' : ''}`} onClick={() => setActiveTab('apps')}>应用列表</div>
          {selectedApp && (
            <>
              <div className={`tab-item ${activeTab === 'envs' ? 'active' : ''}`} onClick={() => setActiveTab('envs')}>环境配置</div>
              <div className={`tab-item ${activeTab === 'versions' ? 'active' : ''}`} onClick={() => setActiveTab('versions')}>版本管理</div>
            </>
          )}
        </div>

        {activeTab === 'apps' && (
          <div>
            <div className="flex flex-between items-center mb-md">
              <h3 className="card-title" style={{ margin: 0 }}>应用列表</h3>
              <button className="btn btn-primary" onClick={() => setShowAppModal(true)}>+ 新建应用</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>应用Key</th>
                  <th>应用名称</th>
                  <th>分类</th>
                  <th>负责人</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td style={{ cursor: 'pointer', color: '#667eea' }} onClick={() => handleSelectApp(app)}>{app.app_key}</td>
                    <td>{app.app_name}</td>
                    <td><span className="tag tag-blue">{app.category}</span></td>
                    <td>{app.owner_name}</td>
                    <td><span className={`status ${app.status === 'active' ? 'status-success' : 'status-closed'}`}>{app.status === 'active' ? '启用' : '停用'}</span></td>
                    <td>{app.created_at}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-sm btn-default" onClick={() => handleSelectApp(app)}>管理</button>
                        <button className="btn btn-sm" style={{ background: app.status === 'active' ? '#f5222d' : '#52c41a', color: 'white' }} onClick={() => handleToggleAppStatus(app)}>
                          {app.status === 'active' ? '停用' : '启用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'envs' && selectedApp && (
          <div>
            <div className="flex flex-between items-center mb-md">
              <h3 className="card-title" style={{ margin: 0 }}>{selectedApp.app_name} - 环境配置</h3>
              <button className="btn btn-primary" onClick={() => setShowEnvModal(true)}>+ 新建环境</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>环境名称</th>
                  <th>类型</th>
                  <th>数据库类型</th>
                  <th>连接信息</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {envs.map((env) => (
                  <tr key={env.id}>
                    <td>{env.env_name}</td>
                    <td><span className={`tag ${env.env_type === 'prod' ? 'tag-red' : env.env_type === 'staging' ? 'tag-orange' : 'tag-blue'}`}>{env.env_type}</span></td>
                    <td><span className="tag tag-green">{env.db_type}</span></td>
                    <td>{env.db_host}:{env.db_port}/{env.db_name}</td>
                    <td><span className={`status ${env.status === 'active' ? 'status-success' : 'status-closed'}`}>{env.status === 'active' ? '启用' : '停用'}</span></td>
                    <td>{env.created_at}</td>
                    <td>
                      <button className="btn btn-sm" style={{ background: env.status === 'active' ? '#f5222d' : '#52c41a', color: 'white' }} onClick={() => handleToggleEnvStatus(env)}>
                        {env.status === 'active' ? '停用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'versions' && selectedApp && (
          <div>
            <div className="flex flex-between items-center mb-md">
              <h3 className="card-title" style={{ margin: 0 }}>{selectedApp.app_name} - 迁移版本</h3>
              <button className="btn btn-primary" onClick={() => setShowVersionModal(true)}>+ 新建版本</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>版本号</th>
                  <th>描述</th>
                  <th>状态</th>
                  <th>创建人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td><span className="tag tag-blue">{v.version}</span></td>
                    <td>{v.description}</td>
                    <td><span className={`status ${v.status === 'approved' ? 'status-success' : v.status === 'deployed' ? 'status-running' : 'status-pending'}`}>{v.status}</span></td>
                    <td>{v.creator_name}</td>
                    <td>{v.created_at}</td>
                    <td>
                      {v.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleApproveVersion(v.id)}>审核通过</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAppModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">新建应用</h3>
              <button className="modal-close" onClick={() => setShowAppModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">应用Key *</label>
                <input className="form-input" value={newApp.app_key} onChange={(e) => setNewApp(p => ({ ...p, app_key: e.target.value }))} placeholder="如: order-service" />
              </div>
              <div className="form-group">
                <label className="form-label">应用名称 *</label>
                <input className="form-input" value={newApp.app_name} onChange={(e) => setNewApp(p => ({ ...p, app_name: e.target.value }))} placeholder="如: 订单服务" />
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <select className="form-select" value={newApp.category} onChange={(e) => setNewApp(p => ({ ...p, category: e.target.value }))}>
                  <option value="business">业务系统</option>
                  <option value="payment">支付系统</option>
                  <option value="infrastructure">基础设施</option>
                  <option value="data">数据平台</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea className="form-input" rows={3} value={newApp.description} onChange={(e) => setNewApp(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowAppModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateApp}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showEnvModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">新建环境</h3>
              <button className="modal-close" onClick={() => setShowEnvModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">环境名称 *</label>
                <input className="form-input" value={newEnv.env_name} onChange={(e) => setNewEnv(p => ({ ...p, env_name: e.target.value }))} placeholder="如: 生产环境" />
              </div>
              <div className="form-group">
                <label className="form-label">环境类型</label>
                <select className="form-select" value={newEnv.env_type} onChange={(e) => setNewEnv(p => ({ ...p, env_type: e.target.value }))}>
                  <option value="dev">开发</option>
                  <option value="test">测试</option>
                  <option value="staging">预发</option>
                  <option value="prod">生产</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">数据库类型</label>
                <select className="form-select" value={newEnv.db_type} onChange={(e) => setNewEnv(p => ({ ...p, db_type: e.target.value }))}>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="oracle">Oracle</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">主机地址 *</label>
                <input className="form-input" value={newEnv.db_host} onChange={(e) => setNewEnv(p => ({ ...p, db_host: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">端口</label>
                <input className="form-input" type="number" value={newEnv.db_port} onChange={(e) => setNewEnv(p => ({ ...p, db_port: parseInt(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">数据库名</label>
                <input className="form-input" value={newEnv.db_name} onChange={(e) => setNewEnv(p => ({ ...p, db_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">用户名</label>
                <input className="form-input" value={newEnv.db_user} onChange={(e) => setNewEnv(p => ({ ...p, db_user: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">密码(加密)</label>
                <input className="form-input" type="password" value={newEnv.db_password_encrypted} onChange={(e) => setNewEnv(p => ({ ...p, db_password_encrypted: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowEnvModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateEnv}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showVersionModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 700 }}>
            <div className="modal-header">
              <h3 className="modal-title">新建迁移版本</h3>
              <button className="modal-close" onClick={() => setShowVersionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">版本号 *</label>
                <input className="form-input" value={newVersion.version} onChange={(e) => setNewVersion(p => ({ ...p, version: e.target.value }))} placeholder="如: v1.0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input className="form-input" value={newVersion.description} onChange={(e) => setNewVersion(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">迁移脚本 *</label>
                <textarea
                  className="form-input"
                  rows={10}
                  value={newVersion.script_content}
                  onChange={(e) => setNewVersion(p => ({ ...p, script_content: e.target.value }))}
                  placeholder="输入SQL迁移脚本..."
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowVersionModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateVersion}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationList;
