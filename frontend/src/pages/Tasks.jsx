import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, appAPI, configAPI } from '../utils/api';

function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [apps, setApps] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({
    app_id: '', env_id: '', version_id: '', task_type: 'gray_release', title: '', description: '',
    reason: '', gray_strategy: 'percentage', gray_percentage: 10, impact_scope: ''
  });
  const [filters, setFilters] = useState({ app_id: '', status: '' });
  const [error, setError] = useState('');
  const [envs, setEnvs] = useState([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [appRes, taskRes] = await Promise.all([
        appAPI.list(),
        taskAPI.list(filters)
      ]);
      setApps(appRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = async (appId) => {
    setForm({ ...form, app_id: appId, env_id: '', version_id: '' });
    if (appId) {
      const [envRes, verRes] = await Promise.all([
        appAPI.getEnvs(appId),
        configAPI.listVersions({ app_id: appId })
      ]);
      setEnvs(envRes.data);
      setVersions(verRes.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const frontValidation = [];
    if (!form.title || form.title.length < 5) frontValidation.push('任务标题至少5个字符，例如："用户中心v1.0.0灰度发布"');
    if (!form.reason || form.reason.length < 10) frontValidation.push('变更原因至少10个字符，需详细说明变更背景和必要性');
    
    if (frontValidation.length > 0) {
      setError({ 
        message: '字段验证失败', 
        details: frontValidation,
        tips: [
          '标题建议格式：[应用名] [版本] [变更类型]',
          '变更原因需包含：背景、目标、影响范围',
          '灰度比例建议从5%-10%开始逐步扩大'
        ]
      });
      return;
    }
    
    try {
      await taskAPI.create(form);
      setShowModal(false);
      setForm({
        app_id: '', env_id: '', version_id: '', task_type: 'gray_release', title: '', description: '',
        reason: '', gray_strategy: 'percentage', gray_percentage: 10, impact_scope: ''
      });
      loadData();
    } catch (err) {
      const details = err.response?.data?.details || [];
      if (details.length > 0) {
        setError({
          message: err.response?.data?.error || '创建失败',
          details: details,
          tips: [
            '标题建议格式：[应用名] [版本] [变更类型]',
            '变更原因需包含：背景、目标、影响范围',
            '灰度比例建议从5%-10%开始逐步扩大'
          ]
        });
      } else {
        setError({ message: err.response?.data?.error || '创建失败', details: [], tips: [] });
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await taskAPI.approve(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason) {
      try {
        await taskAPI.reject(id, reason);
        loadData();
      } catch (err) {
        alert(err.response?.data?.error || '操作失败');
      }
    }
  };

  const handleExecute = async (id) => {
    try {
      await taskAPI.execute(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleRollback = async (id) => {
    const reason = prompt('请输入回滚原因：');
    if (reason) {
      try {
        await taskAPI.rollback(id, reason);
        loadData();
      } catch (err) {
        alert(err.response?.data?.error || '操作失败');
      }
    }
  };

  const handleBatchAction = async (action) => {
    try {
      await taskAPI.batch(action, selectedIds);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
          <option value="pending">待审批</option>
          <option value="approved">已通过</option>
          <option value="running">执行中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒绝</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 创建执行任务</button>
      </div>

      {selectedIds.length > 0 && (
        <div className="batch-actions">
          <span>已选择 {selectedIds.length} 项</span>
          <button className="btn btn-success btn-sm" onClick={() => handleBatchAction('approve')}>批量通过</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleBatchAction('reject')}>批量拒绝</button>
          <button className="btn btn-default btn-sm" onClick={() => setSelectedIds([])}>取消选择</button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === tasks.length && tasks.length > 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? tasks.map(t => t.id) : [])}
                />
              </th>
              <th>任务标题</th>
              <th>应用</th>
              <th>灰度比例</th>
              <th>配置版本</th>
              <th>创建人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state">暂无执行任务</div></td></tr>
            ) : (
              tasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td><strong>{t.title}</strong></td>
                  <td>{t.app_name}</td>
                  <td>{t.gray_percentage}%</td>
                  <td><code>{t.config_version}</code></td>
                  <td>{t.creator_name}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-default btn-sm" onClick={() => navigate(`/tasks/${t.id}`)}>详情</button>
                      {t.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(t.id)}>通过</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(t.id)}>拒绝</button>
                        </>
                      )}
                      {t.status === 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleExecute(t.id)}>执行</button>
                      )}
                      {t.status === 'completed' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleRollback(t.id)}>回滚</button>
                      )}
                    </div>
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
              <h3>创建执行任务</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="error-message">
                    <div style={{ marginBottom: '8px', fontWeight: 600 }}>{error.message || error}</div>
                    {error.details && error.details.length > 0 && (
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
                        {error.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                    {error.tips && error.tips.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ffccc7', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 规范建议：</div>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {error.tips.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="detail-grid">
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
                    <label>配置版本 *</label>
                    <select value={form.version_id} onChange={(e) => setForm({ ...form, version_id: e.target.value })} required>
                      <option value="">请选择版本</option>
                      {versions.map(v => <option key={v.id} value={v.id}>{v.version}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>任务类型 *</label>
                    <select value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
                      <option value="gray_release">灰度发布</option>
                      <option value="full_release">全量发布</option>
                      <option value="rollback">配置回滚</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>任务标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="简洁描述本次变更的目的"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>变更原因 *</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="详细说明变更的背景、原因和预期影响（至少10个字符）"
                    rows={3}
                    required
                  />
                </div>
                <div className="detail-grid">
                  <div className="form-group">
                    <label>灰度策略 *</label>
                    <select value={form.gray_strategy} onChange={(e) => setForm({ ...form, gray_strategy: e.target.value })}>
                      <option value="percentage">按比例灰度</option>
                      <option value="canary">金丝雀发布</option>
                      <option value="user_group">按用户组</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>灰度比例 (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.gray_percentage}
                      onChange={(e) => setForm({ ...form, gray_percentage: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>影响范围说明</label>
                  <textarea
                    value={form.impact_scope}
                    onChange={(e) => setForm({ ...form, impact_scope: e.target.value })}
                    placeholder="描述本次变更可能影响的业务范围"
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建任务</button>
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

export default Tasks;
