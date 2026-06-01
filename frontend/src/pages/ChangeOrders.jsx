import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function ChangeOrders() {
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [formData, setFormData] = useState({ app_id: '', change_type: 'config', title: '', description: '', config_data: '' });
  const [filters, setFilters] = useState({ status: '', app_id: '' });

  useEffect(() => {
    loadOrders();
    loadApplications();
  }, [filters]);

  const loadOrders = async () => {
    try {
      const res = await api.get('/change-orders', { params: filters });
      setOrders(res.data.list);
    } catch (err) {
      console.error('加载变更单失败', err);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.list);
    } catch (err) {
      console.error('加载应用失败', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/change-orders', formData);
      loadOrders();
      setShowModal(false);
      setFormData({ app_id: '', change_type: 'config', title: '', description: '', config_data: '' });
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await api.post(`/change-orders/${id}/submit`);
      loadOrders();
      alert('提交成功');
    } catch (err) {
      alert(err.response?.data?.error || '提交失败');
    }
  };

  const handleApprove = async (id) => {
    const comment = prompt('请输入审批意见：');
    try {
      await api.post(`/change-orders/${id}/approve`, { comment });
      loadOrders();
      if (orderDetail?.id === id) {
        loadOrderDetail(id);
      }
      alert('审批通过');
    } catch (err) {
      alert(err.response?.data?.error || '审批失败');
    }
  };

  const handleReject = async (id) => {
    const comment = prompt('请输入驳回原因：');
    if (!comment) return;
    try {
      await api.post(`/change-orders/${id}/reject`, { comment });
      loadOrders();
      if (orderDetail?.id === id) {
        loadOrderDetail(id);
      }
      alert('已驳回');
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const loadOrderDetail = async (id) => {
    try {
      const res = await api.get(`/change-orders/${id}`);
      setOrderDetail(res.data);
    } catch (err) {
      console.error('加载详情失败', err);
    }
  };

  const handleView = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetail(order.id);
    setShowModal(true);
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📝 变更审批</h2>
          <button className="btn btn-primary" onClick={() => { setSelectedOrder(null); setOrderDetail(null); setShowModal(true); }}>
            + 发起变更
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">全部</option>
              <option value="pending">待提交</option>
              <option value="approving">审批中</option>
              <option value="executing">执行中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <div className="filter-item">
            <label>应用：</label>
            <select className="form-select" value={filters.app_id} onChange={(e) => setFilters({ ...filters, app_id: e.target.value })}>
              <option value="">全部</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.app_name}</option>
              ))}
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>变更单号</th>
              <th>标题</th>
              <th>应用</th>
              <th>变更类型</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.order_no}</td>
                <td>{order.title}</td>
                <td>{order.app_name}</td>
                <td>{order.change_type}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                <td>{order.creator_name}</td>
                <td>{order.created_at}</td>
                <td>
                  <button className="btn btn-default" style={{ marginRight: 8 }} onClick={() => handleView(order)}>查看</button>
                  {order.status === 'pending' && (
                    <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleSubmit(order.id)}>提交</button>
                  )}
                  {order.status === 'approving' && user.role !== 'developer' && (
                    <>
                      <button className="btn btn-success" style={{ marginRight: 8 }} onClick={() => handleApprove(order.id)}>通过</button>
                      <button className="btn btn-danger" onClick={() => handleReject(order.id)}>驳回</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{orderDetail ? '变更单详情' : '发起变更'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {orderDetail ? (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <p><strong>变更单号：</strong>{orderDetail.order_no}</p>
                    <p><strong>标题：</strong>{orderDetail.title}</p>
                    <p><strong>应用：</strong>{orderDetail.app_name}</p>
                    <p><strong>状态：</strong><span className={`status-badge status-${orderDetail.status}`}>{orderDetail.status}</span></p>
                    <p><strong>描述：</strong>{orderDetail.description}</p>
                  </div>

                  <h4 style={{ marginBottom: 16 }}>审批流程</h4>
                  <div className="timeline">
                    {orderDetail.nodes?.map((node, idx) => {
                      const record = orderDetail.approval_records?.find(r => r.node_id === node.id);
                      return (
                        <div key={node.id} className="timeline-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{node.node_name}</strong>
                            <span style={{ color: '#999' }}>{node.approver_role || node.approver_name}</span>
                          </div>
                          {record && (
                            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                              <div>结果：<span className={`status-badge status-${record.action === 'approve' ? 'success' : 'failed'}`}>{record.action === 'approve' ? '通过' : '驳回'}</span></div>
                              <div>审批人：{record.approver_name}</div>
                              <div>意见：{record.comment || '-'}</div>
                              <div>时间：{record.created_at}</div>
                            </div>
                          )}
                          {!record && idx === orderDetail.approval_records?.length && orderDetail.status === 'approving' && (
                            <div style={{ marginTop: 8, fontSize: 14, color: '#1890ff' }}>
                              ⏳ 待审批
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {orderDetail.status === 'approving' && user.role !== 'developer' && (
                    <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn btn-success" onClick={() => handleApprove(orderDetail.id)}>通过</button>
                      <button className="btn btn-danger" onClick={() => handleReject(orderDetail.id)}>驳回</button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreate}>
                  <div className="form-group">
                    <label className="form-label">选择应用</label>
                    <select
                      className="form-select"
                      value={formData.app_id}
                      onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                      required
                    >
                      <option value="">请选择</option>
                      {applications.map(app => (
                        <option key={app.id} value={app.id}>{app.app_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">变更类型</label>
                    <select
                      className="form-select"
                      value={formData.change_type}
                      onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
                    >
                      <option value="config">配置变更</option>
                      <option value="deploy">版本发布</option>
                      <option value="rollback">版本回滚</option>
                      <option value="permission">权限变更</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">变更标题</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">变更描述</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">配置数据（JSON）</label>
                    <textarea
                      className="form-textarea"
                      value={formData.config_data}
                      onChange={(e) => setFormData({ ...formData, config_data: e.target.value })}
                      placeholder='{"key": "value"}'
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? '创建中...' : '创建'}
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

export default ChangeOrders;
