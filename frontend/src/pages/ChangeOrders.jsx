import React, { useState, useEffect } from 'react';
import { changeOrderAPI, appAPI } from '../utils/api';

function ChangeOrders() {
  const [orders, setOrders] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'config', app_id: '', risk_level: 'medium' });
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [appRes, orderRes] = await Promise.all([
        appAPI.list(),
        changeOrderAPI.list(filters)
      ]);
      setApps(appRes.data);
      setOrders(orderRes.data);
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
      await changeOrderAPI.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', type: 'config', app_id: '', risk_level: 'medium' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleApprove = async (id) => {
    try {
      await changeOrderAPI.approve(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="filter-bar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="pending">待审批</option>
          <option value="approved">已通过</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">全部类型</option>
          <option value="config">配置变更</option>
          <option value="feature">功能发布</option>
          <option value="hotfix">紧急修复</option>
          <option value="rollback">版本回滚</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 创建变更单</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>变更单标题</th>
              <th>类型</th>
              <th>关联应用</th>
              <th>风险等级</th>
              <th>创建人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state">暂无变更单</div></td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.title}</strong></td>
                  <td><TypeBadge type={o.type} /></td>
                  <td>{o.app_name || '-'}</td>
                  <td><RiskBadge level={o.risk_level} /></td>
                  <td>{o.creator_name}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    {o.status === 'pending' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(o.id)}>审批</button>
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
              <h3>创建变更单</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label>变更单标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="简要描述本次变更"
                    required
                  />
                </div>
                <div className="detail-grid">
                  <div className="form-group">
                    <label>变更类型 *</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="config">配置变更</option>
                      <option value="feature">功能发布</option>
                      <option value="hotfix">紧急修复</option>
                      <option value="rollback">版本回滚</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>关联应用</label>
                    <select value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })}>
                      <option value="">无</option>
                      {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>风险等级</label>
                  <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })}>
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>变更描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="详细描述变更内容、影响范围、验证方案等"
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
    approved: { class: 'badge-success', text: '已通过' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

const TypeBadge = ({ type }) => {
  const typeMap = {
    config: { class: 'badge-info', text: '配置变更' },
    feature: { class: 'badge-success', text: '功能发布' },
    hotfix: { class: 'badge-error', text: '紧急修复' },
    rollback: { class: 'badge-warning', text: '版本回滚' }
  };
  const badge = typeMap[type] || { class: 'badge-default', text: type };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

const RiskBadge = ({ level }) => {
  const riskMap = {
    low: { class: 'badge-success', text: '低风险' },
    medium: { class: 'badge-warning', text: '中风险' },
    high: { class: 'badge-error', text: '高风险' }
  };
  const badge = riskMap[level] || { class: 'badge-default', text: level };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default ChangeOrders;
