import React, { useState, useEffect } from 'react';
import { alertAPI, appAPI, userAPI } from '../utils/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'task_failed', level: 'warning', title: '', message: '',
    app_id: '', responsible_id: '', suggested_action: ''
  });
  const [filters, setFilters] = useState({ status: 'open', level: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [alertRes, appRes, userRes] = await Promise.all([
        alertAPI.list(filters),
        appAPI.list(),
        userAPI.list().catch(() => ({ data: [] }))
      ]);
      setAlerts(alertRes.data);
      setApps(appRes.data);
      setUsers(userRes.data || []);
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
      await alertAPI.create(form);
      setShowModal(false);
      setForm({
        type: 'task_failed', level: 'warning', title: '', message: '',
        app_id: '', responsible_id: '', suggested_action: ''
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleClose = async (id) => {
    const reason = prompt('请输入关闭原因：');
    if (reason) {
      try {
        await alertAPI.close(id, reason);
        loadData();
      } catch (err) {
        alert(err.response?.data?.error || '操作失败');
      }
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  const openCount = alerts.filter(a => a.status === 'open').length;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card danger">
          <h4>严重告警</h4>
          <div className="value">{alerts.filter(a => a.level === 'critical' && a.status === 'open').length}</div>
        </div>
        <div className="stat-card warning">
          <h4>警告</h4>
          <div className="value">{alerts.filter(a => a.level === 'warning' && a.status === 'open').length}</div>
        </div>
        <div className="stat-card">
          <h4>提示信息</h4>
          <div className="value">{alerts.filter(a => a.level === 'info' && a.status === 'open').length}</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="open">待处理</option>
          <option value="closed">已关闭</option>
          <option value="">全部</option>
        </select>
        <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
          <option value="">全部级别</option>
          <option value="critical">严重</option>
          <option value="warning">警告</option>
          <option value="info">提示</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 创建告警</button>
      </div>

      <div className="card">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">暂无告警记录</div>
          </div>
        ) : (
          <div>
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-item ${alert.level}`}>
                <div className="alert-header">
                  <span className="alert-title">
                    <LevelBadge level={alert.level} /> {alert.title}
                  </span>
                  {alert.status === 'open' && (
                    <button className="btn btn-default btn-sm" onClick={() => handleClose(alert.id)}>关闭</button>
                  )}
                </div>
                <div className="alert-content">{alert.message}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', display: 'flex', gap: 16 }}>
                  <span>类型: {TypeLabel(alert.type)}</span>
                  <span>应用: {alert.app_name || '-'}</span>
                  <span>责任人: {alert.responsible_name || '未分配'}</span>
                  <span>创建时间: {new Date(alert.created_at).toLocaleString()}</span>
                </div>
                {alert.suggested_action && (
                  <div style={{ marginTop: 8, fontSize: '13px' }}>
                    <strong>建议动作：</strong>{alert.suggested_action}
                  </div>
                )}
                {alert.closed_at && (
                  <div style={{ marginTop: 8, fontSize: '13px', color: '#52c41a' }}>
                    <strong>关闭原因：</strong>{alert.close_reason}（由 {alert.closer_name} 关闭）
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建告警</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="detail-grid">
                  <div className="form-group">
                    <label>告警类型 *</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="duplicate_execution">重复执行</option>
                      <option value="permission_violation">权限越权</option>
                      <option value="config_mismatch">配置误发</option>
                      <option value="task_failed">任务失败</option>
                      <option value="sensitive_leak">敏感信息泄露</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>告警级别 *</label>
                    <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      <option value="critical">严重</option>
                      <option value="warning">警告</option>
                      <option value="info">提示</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>告警标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>告警详情 *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="detail-grid">
                  <div className="form-group">
                    <label>关联应用</label>
                    <select value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })}>
                      <option value="">无</option>
                      {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>责任人</label>
                    <select value={form.responsible_id} onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}>
                      <option value="">未分配</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>建议动作</label>
                  <textarea
                    value={form.suggested_action}
                    onChange={(e) => setForm({ ...form, suggested_action: e.target.value })}
                    rows={2}
                    placeholder="描述建议的处理方式"
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

const LevelBadge = ({ level }) => {
  const map = {
    critical: { class: 'badge-error', text: '严重' },
    warning: { class: 'badge-warning', text: '警告' },
    info: { class: 'badge-info', text: '提示' }
  };
  const badge = map[level] || { class: 'badge-default', text: level };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

const TypeLabel = (type) => {
  const map = {
    duplicate_execution: '重复执行',
    permission_violation: '权限越权',
    config_mismatch: '配置误发',
    task_failed: '任务失败',
    sensitive_leak: '敏感信息泄露',
    other: '其他'
  };
  return map[type] || type;
};

export default Alerts;
