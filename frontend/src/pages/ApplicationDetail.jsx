import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [envModal, setEnvModal] = useState(false);
  const [verModal, setVerModal] = useState(false);
  const [secModal, setSecModal] = useState(false);
  const [envForm, setEnvForm] = useState({ env_name: '', env_type: 'dev', server_address: '' });
  const [verForm, setVerForm] = useState({ version_number: '', release_notes: '', env_id: '' });
  const [secForm, setSecForm] = useState({ secret_name: '', secret_type: 'password', secret_value: '', valid_from: '', valid_until: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [appRes, usersRes] = await Promise.all([
        apiService.getApplication(id),
        apiService.getUsers()
      ]);
      setApp(appRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  const handleEnvSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createEnvironment({ ...envForm, app_id: id });
      setEnvModal(false);
      setEnvForm({ env_name: '', env_type: 'dev', server_address: '' });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleVerSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createVersion({ ...verForm, app_id: id });
      setVerModal(false);
      setVerForm({ version_number: '', release_notes: '', env_id: '' });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleSecSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createSecret({ ...secForm, app_id: id });
      setSecModal(false);
      setSecForm({ secret_name: '', secret_type: 'password', secret_value: '', valid_from: '', valid_until: '' });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  if (!app) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/applications" className="link-text">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">{app.app_name} <code>({app.app_code})</code></h1>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
        <button className={`tab ${activeTab === 'envs' ? 'active' : ''}`} onClick={() => setActiveTab('envs')}>环境配置</button>
        <button className={`tab ${activeTab === 'versions' ? 'active' : ''}`} onClick={() => setActiveTab('versions')}>版本管理</button>
        <button className={`tab ${activeTab === 'secrets' ? 'active' : ''}`} onClick={() => setActiveTab('secrets')}>密钥管理</button>
      </div>

      {activeTab === 'basic' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">应用编码</span>
              <span className="value">{app.app_code}</span>
            </div>
            <div className="detail-item">
              <span className="label">应用名称</span>
              <span className="value">{app.app_name}</span>
            </div>
            <div className="detail-item">
              <span className="label">分类</span>
              <span className="value">{app.category}</span>
            </div>
            <div className="detail-item">
              <span className="label">负责人</span>
              <span className="value">{app.owner_name || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="label">技术栈</span>
              <span className="value">{app.tech_stack || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="label">状态</span>
              <span className="value">
                <span className={`badge badge-${app.status === 'active' ? 'active' : 'inactive'}`}>
                  {app.status === 'active' ? '启用' : '停用'}
                </span>
              </span>
            </div>
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="label">描述</span>
              <span className="value">{app.description || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'envs' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>环境列表</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setEnvModal(true)}>
              <Plus size={14} /> 添加环境
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>环境名称</th>
                  <th>环境类型</th>
                  <th>服务器地址</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {app.environments?.map(env => (
                  <tr key={env.id}>
                    <td>{env.env_name}</td>
                    <td>{env.env_type}</td>
                    <td>{env.server_address || '-'}</td>
                    <td><span className={`badge badge-${env.status === 'active' ? 'active' : 'inactive'}`}>{env.status === 'active' ? '启用' : '停用'}</span></td>
                    <td>{new Date(env.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!app.environments || app.environments.length === 0) && (
                  <tr><td colSpan="5" className="empty-state">暂无环境配置</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>版本列表</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setVerModal(true)}>
              <Plus size={14} /> 添加版本
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>版本号</th>
                  <th>发布说明</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {app.versions?.map(v => (
                  <tr key={v.id}>
                    <td><code>{v.version_number}</code></td>
                    <td>{v.release_notes || '-'}</td>
                    <td><span className="badge badge-draft">{v.status}</span></td>
                    <td>{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!app.versions || app.versions.length === 0) && (
                  <tr><td colSpan="4" className="empty-state">暂无版本记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'secrets' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>密钥列表</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setSecModal(true)}>
              <Plus size={14} /> 添加密钥
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>密钥名称</th>
                  <th>类型</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {app.secrets?.map(s => (
                  <tr key={s.id}>
                    <td>{s.secret_name}</td>
                    <td>{s.secret_type}</td>
                    <td>{s.valid_from || '-'} ~ {s.valid_until || '-'}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'active' : 'inactive'}`}>{s.status === 'active' ? '有效' : '失效'}</span></td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!app.secrets || app.secrets.length === 0) && (
                  <tr><td colSpan="5" className="empty-state">暂无密钥配置</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {envModal && (
        <div className="modal-overlay" onClick={() => setEnvModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加环境</h2>
              <button className="modal-close" onClick={() => setEnvModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEnvSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>环境名称 *</label>
                  <input required value={envForm.env_name} onChange={e => setEnvForm({...envForm, env_name: e.target.value})} placeholder="如：生产环境" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>环境类型</label>
                    <select value={envForm.env_type} onChange={e => setEnvForm({...envForm, env_type: e.target.value})}>
                      <option value="dev">开发</option>
                      <option value="test">测试</option>
                      <option value="staging">预发布</option>
                      <option value="prod">生产</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>服务器地址</label>
                    <input value={envForm.server_address} onChange={e => setEnvForm({...envForm, server_address: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEnvModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {verModal && (
        <div className="modal-overlay" onClick={() => setVerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加版本</h2>
              <button className="modal-close" onClick={() => setVerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleVerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>版本号 *</label>
                  <input required value={verForm.version_number} onChange={e => setVerForm({...verForm, version_number: e.target.value})} placeholder="如：v1.0.0" />
                </div>
                <div className="form-group">
                  <label>发布说明</label>
                  <textarea rows="3" value={verForm.release_notes} onChange={e => setVerForm({...verForm, release_notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setVerModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {secModal && (
        <div className="modal-overlay" onClick={() => setSecModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加密钥</h2>
              <button className="modal-close" onClick={() => setSecModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSecSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>密钥名称 *</label>
                    <input required value={secForm.secret_name} onChange={e => setSecForm({...secForm, secret_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>密钥类型</label>
                    <select value={secForm.secret_type} onChange={e => setSecForm({...secForm, secret_type: e.target.value})}>
                      <option value="password">密码</option>
                      <option value="api_key">API Key</option>
                      <option value="token">Token</option>
                      <option value="certificate">证书</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>密钥值 *</label>
                  <input type="password" required value={secForm.secret_value} onChange={e => setSecForm({...secForm, secret_value: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>生效时间</label>
                    <input type="datetime-local" value={secForm.valid_from} onChange={e => setSecForm({...secForm, valid_from: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>失效时间</label>
                    <input type="datetime-local" value={secForm.valid_until} onChange={e => setSecForm({...secForm, valid_until: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSecModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationDetail;
