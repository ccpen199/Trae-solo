import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appAPI } from '../utils/api';

function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', tech_stack: '' });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const res = await appAPI.list();
      setApps(res.data);
    } catch (err) {
      console.error('加载应用失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await appAPI.create(form);
      setShowModal(false);
      setForm({ name: '', code: '', description: '', tech_stack: '' });
      loadApps();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.includes(filter) || app.code.includes(filter)
  );

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索应用名称或代码..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: 300 }}
        />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 接入新应用</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>应用名称</th>
              <th>应用代码</th>
              <th>技术栈</th>
              <th>负责人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-text">暂无应用数据</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApps.map(app => (
                <tr key={app.id}>
                  <td><strong>{app.name}</strong></td>
                  <td><code>{app.code}</code></td>
                  <td>{app.tech_stack || '-'}</td>
                  <td>{app.owner_name}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>{new Date(app.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/applications/${app.id}`)}>
                      查看详情
                    </button>
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
              <h3>接入新应用</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label>应用名称 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如：用户中心服务"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>应用代码 *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="如：user-center（小写字母、数字、横杠）"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>技术栈</label>
                  <input
                    type="text"
                    value={form.tech_stack}
                    onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                    placeholder="如：Node.js、Java、Go"
                  />
                </div>
                <div className="form-group">
                  <label>应用描述 *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="请描述应用的主要功能和业务范围（至少10个字符）"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建应用</button>
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
    active: { class: 'badge-success', text: '正常' },
    inactive: { class: 'badge-default', text: '停用' },
    deleted: { class: 'badge-error', text: '已删除' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default Applications;
