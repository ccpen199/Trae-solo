import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appAPI, configAPI, taskAPI } from '../utils/api';

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [activeTab, setActiveTab] = useState('envs');
  const [loading, setLoading] = useState(true);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envForm, setEnvForm] = useState({ name: '开发环境', description: '' });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({ env_id: '', version: 'v1.0.0', config_content: '{}', comment: '' });
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      const res = await appAPI.get(id);
      setApp(res.data);
    } catch (err) {
      console.error('加载应用详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnv = async (e) => {
    e.preventDefault();
    try {
      await appAPI.createEnv(id, envForm);
      setShowEnvModal(false);
      setEnvForm({ name: '开发环境', description: '' });
      loadApp();
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    setConfigError('');
    try {
      await configAPI.createVersion({
        ...configForm,
        app_id: id,
        config_type: 'json'
      });
      setShowConfigModal(false);
      setConfigForm({ env_id: '', version: 'v1.0.0', config_content: '{}', comment: '' });
      loadApp();
    } catch (err) {
      setConfigError(err.response?.data?.error || '创建失败');
    }
  };

  const handleConfigStatusChange = async (versionId, status) => {
    try {
      await configAPI.updateVersionStatus(versionId, status);
      loadApp();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!app) return <div className="error-message">应用不存在</div>;

  return (
    <div>
      <button className="btn btn-default btn-sm" onClick={() => navigate('/applications')} style={{ marginBottom: 16 }}>
        ← 返回应用列表
      </button>

      <div className="card">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">应用名称</span>
            <span className="detail-value"><strong>{app.name}</strong></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">应用代码</span>
            <span className="detail-value"><code>{app.code}</code></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">技术栈</span>
            <span className="detail-value">{app.tech_stack || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">负责人</span>
            <span className="detail-value">{app.owner_name}</span>
          </div>
          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
            <span className="detail-label">应用描述</span>
            <span className="detail-value">{app.description}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'envs' ? 'active' : ''}`} onClick={() => setActiveTab('envs')}>
          环境管理 ({app.environments?.length || 0})
        </div>
        <div className={`tab-item ${activeTab === 'configs' ? 'active' : ''}`} onClick={() => setActiveTab('configs')}>
          配置版本 ({app.versions?.length || 0})
        </div>
        <div className={`tab-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          执行任务 ({app.tasks?.length || 0})
        </div>
      </div>

      {activeTab === 'envs' && (
        <div className="card">
          <div className="card-header">
            <h3>环境列表</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowEnvModal(true)}>+ 添加环境</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>环境名称</th>
                <th>描述</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {app.environments?.map(env => (
                <tr key={env.id}>
                  <td><strong>{env.name}</strong></td>
                  <td>{env.description || '-'}</td>
                  <td><span className="badge badge-success">正常</span></td>
                  <td>{new Date(env.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'configs' && (
        <div className="card">
          <div className="card-header">
            <h3>配置版本</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowConfigModal(true)}>+ 创建配置版本</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>版本号</th>
                <th>环境</th>
                <th>创建人</th>
                <th>状态</th>
                <th>备注</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {app.versions?.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">暂无配置版本</div></td></tr>
              ) : (
                app.versions?.map(v => (
                  <tr key={v.id}>
                    <td><code>{v.version}</code></td>
                    <td><span className="badge badge-info">{v.env_name}</span></td>
                    <td>{v.creator_name || '-'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>{v.comment || '-'}</td>
                    <td>{new Date(v.created_at).toLocaleString()}</td>
                    <td>
                      {v.status === 'draft' && (
                        <button className="btn btn-default btn-sm" onClick={() => handleConfigStatusChange(v.id, 'pending')}>
                          提交审批
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="card">
          <div className="card-header">
            <h3>执行任务</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>任务标题</th>
                <th>灰度比例</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {app.tasks?.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">暂无执行任务</div></td></tr>
              ) : (
                app.tasks?.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.gray_percentage}%</td>
                    <td><TaskStatusBadge status={t.status} /></td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-default btn-sm" onClick={() => navigate(`/tasks/${t.id}`)}>查看</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEnvModal && (
        <div className="modal-overlay" onClick={() => setShowEnvModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加环境</h3>
              <span className="modal-close" onClick={() => setShowEnvModal(false)}>×</span>
            </div>
            <form onSubmit={handleCreateEnv}>
              <div className="modal-body">
                <div className="form-group">
                  <label>环境名称 *</label>
                  <select value={envForm.name} onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })}>
                    <option value="开发环境">开发环境</option>
                    <option value="测试环境">测试环境</option>
                    <option value="预发环境">预发环境</option>
                    <option value="生产环境">生产环境</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>环境描述</label>
                  <textarea
                    value={envForm.description}
                    onChange={(e) => setEnvForm({ ...envForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowEnvModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建配置版本 - {app.name}</h3>
              <span className="modal-close" onClick={() => setShowConfigModal(false)}>×</span>
            </div>
            <form onSubmit={handleCreateConfig}>
              <div className="modal-body">
                {configError && <div className="error-message">{configError}</div>}
                <div className="form-group">
                  <label>环境 *</label>
                  <select value={configForm.env_id} onChange={(e) => setConfigForm({ ...configForm, env_id: e.target.value })} required>
                    <option value="">请选择环境</option>
                    {app.environments?.map(env => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>版本号 *</label>
                  <input
                    type="text"
                    value={configForm.version}
                    onChange={(e) => setConfigForm({ ...configForm, version: e.target.value })}
                    placeholder="v1.0.0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>配置内容 (JSON) *</label>
                  <textarea
                    value={configForm.config_content}
                    onChange={(e) => setConfigForm({ ...configForm, config_content: e.target.value })}
                    rows={8}
                    placeholder='{"key": "value"}'
                    required
                  />
                </div>
                <div className="form-group">
                  <label>版本说明</label>
                  <textarea
                    value={configForm.comment}
                    onChange={(e) => setConfigForm({ ...configForm, comment: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowConfigModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const badgeMap = {
    draft: { class: 'badge-default', text: '草稿' },
    pending: { class: 'badge-warning', text: '待审批' },
    approved: { class: 'badge-info', text: '已通过' },
    published: { class: 'badge-success', text: '已发布' },
    archived: { class: 'badge-default', text: '已归档' },
    rejected: { class: 'badge-error', text: '已拒绝' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

const TaskStatusBadge = ({ status }) => {
  const badgeMap = {
    pending: { class: 'badge-warning', text: '待审批' },
    approved: { class: 'badge-info', text: '已通过' },
    running: { class: 'badge-info', text: '执行中' },
    completed: { class: 'badge-success', text: '已完成' },
    rejected: { class: 'badge-error', text: '已拒绝' },
    cancelled: { class: 'badge-default', text: '已取消' },
    rollback: { class: 'badge-error', text: '已回滚' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default ApplicationDetail;
