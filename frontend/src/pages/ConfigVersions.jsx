import React, { useState, useEffect } from 'react';
import { configAPI, appAPI } from '../utils/api';

function ConfigVersions() {
  const [versions, setVersions] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ app_id: '', env_id: '', version: '', config_content: '{}', comment: '' });
  const [filters, setFilters] = useState({ app_id: '', status: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [appRes, versionRes] = await Promise.all([
        appAPI.list(),
        configAPI.listVersions(filters)
      ]);
      setApps(appRes.data);
      setVersions(versionRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const [envs, setEnvs] = useState([]);

  const handleAppChange = async (appId) => {
    setForm({ ...form, app_id: appId, env_id: '' });
    if (appId) {
      const res = await appAPI.getEnvs(appId);
      setEnvs(res.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await configAPI.createVersion({ ...form, config_type: 'json' });
      setShowModal(false);
      setForm({ app_id: '', env_id: '', version: '', config_content: '{}', comment: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await configAPI.updateVersionStatus(id, status);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="filter-bar">
        <select value={filters.app_id} onChange={(e) => setFilters({ ...filters, app_id: e.target.value })}>
          <option value="">全部应用</option>
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="pending">待审批</option>
          <option value="approved">已通过</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 创建配置版本</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>版本号</th>
              <th>应用</th>
              <th>环境</th>
              <th>创建人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state">暂无配置版本</div></td></tr>
            ) : (
              versions.map(v => (
                <tr key={v.id}>
                  <td><code>{v.version}</code></td>
                  <td>{v.app_name}</td>
                  <td>{v.env_name}</td>
                  <td>{v.creator_name}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>{new Date(v.created_at).toLocaleString()}</td>
                  <td>
                    {v.status === 'draft' && (
                      <button className="btn btn-default btn-sm" onClick={() => handleStatusChange(v.id, 'pending')}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建配置版本</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label>应用 *</label>
                  <select value={form.app_id} onChange={(e) => handleAppChange(e.target.value)} required>
                    <option value="">请选择应用</option>
                    {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>环境 *</label>
                  <select value={form.env_id} onChange={(e) => setForm({ ...form, env_id: e.target.value })} required>
                    <option value="">请选择环境</option>
                    {envs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>版本号 *</label>
                  <input
                    type="text"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="v1.0.0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>配置内容 (JSON) *</label>
                  <textarea
                    value={form.config_content}
                    onChange={(e) => setForm({ ...form, config_content: e.target.value })}
                    rows={8}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>版本说明</label>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    rows={2}
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

export default ConfigVersions;
