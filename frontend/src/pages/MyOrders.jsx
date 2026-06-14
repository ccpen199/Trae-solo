import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function MyOrders({ showToast }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deliverable, setDeliverable] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealType, setAppealType] = useState('payment');

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'verified', label: '待开始' },
    { key: 'in_progress', label: '进行中' },
    { key: 'submitted', label: '待审核' },
    { key: 'reviewing', label: '抽检中' },
    { key: 'completed', label: '已完成' },
    { key: 'rejected', label: '已驳回' }
  ];

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await api.get(`/orders/my${params}`);
      setOrders(response.data.data || []);
    } catch (error) {
      showToast('加载订单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/start`);
      showToast('已开始工作', 'success');
      loadOrders();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    }
  };

  const openSubmitModal = (order) => {
    setSelectedOrder(order);
    setDeliverable('');
    setDeliverableUrl('');
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    if (!deliverable && !deliverableUrl) {
      showToast('请填写交付内容或上传附件', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post(`/orders/${selectedOrder.id}/submit`, {
        deliverable,
        deliverable_url: deliverableUrl
      });
      showToast('提交成功', 'success');
      setShowSubmitModal(false);
      loadOrders();
    } catch (error) {
      showToast(error.response?.data?.error || '提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openAppealModal = (order) => {
    setSelectedOrder(order);
    setAppealReason('');
    setAppealType('payment');
    setShowAppealModal(true);
  };

  const handleAppeal = async () => {
    if (!appealReason) {
      showToast('请填写申诉理由', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post(`/orders/${selectedOrder.id}/appeal`, {
        type: appealType,
        reason: appealReason
      });
      showToast('申诉已提交', 'success');
      setShowAppealModal(false);
      loadOrders();
    } catch (error) {
      showToast(error.response?.data?.error || '提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      accepted: '待核验',
      verified: '待开始',
      in_progress: '进行中',
      submitted: '待审核',
      reviewing: '抽检中',
      completed: '已完成',
      rejected: '已驳回',
      cancelled: '已取消',
      appealing: '申诉中'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      accepted: 'badge-warning',
      verified: 'badge-info',
      in_progress: 'badge-info',
      submitted: 'badge-warning',
      reviewing: 'badge-warning',
      completed: 'badge-success',
      rejected: 'badge-danger',
      cancelled: 'badge-secondary',
      appealing: 'badge-warning'
    };
    return classes[status] || 'badge-secondary';
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '32px' }}>我的任务</h1>
      
      <div className="tabs" style={{ overflowX: 'auto' }}>
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : orders.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>任务名称</th>
                <th>类型</th>
                <th>佣金</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ cursor: 'pointer', color: '#667eea', fontWeight: 500 }}
                         onClick={() => navigate(`/tasks/${order.task_id}`)}>
                      {order.title}
                    </div>
                  </td>
                  <td>
                    <span className={`task-type task-type-${order.task_type}`}>
                      {order.task_type === 'online' ? '线上' : order.task_type === 'offline' ? '线下' : '混合'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>¥{order.amount}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '13px' }}>
                    {order.created_at?.substring(0, 16)}
                  </td>
                  <td>
                    {order.status === 'verified' && (
                      <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}
                              onClick={() => handleStart(order.id)}>
                        开始工作
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}
                              onClick={() => openSubmitModal(order)}>
                        提交交付
                      </button>
                    )}
                    {(order.status === 'completed' || order.status === 'rejected') && (
                      <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }}
                              onClick={() => openAppealModal(order)}>
                        申诉
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <p>暂无任务记录</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }}
                  onClick={() => navigate('/tasks')}>
            去浏览任务
          </button>
        </div>
      )}
      
      {showSubmitModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">提交交付成果</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              任务：{selectedOrder.title}
            </p>
            
            <div className="form-group">
              <label className="form-label">交付内容描述</label>
              <textarea
                className="form-textarea"
                value={deliverable}
                onChange={e => setDeliverable(e.target.value)}
                placeholder="请描述您的交付内容..."
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">附件链接（可选）</label>
              <input
                type="text"
                className="form-input"
                value={deliverableUrl}
                onChange={e => setDeliverableUrl(e.target.value)}
                placeholder="请输入截图或文件链接"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAppealModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowAppealModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">发起申诉</h2>
            
            <div className="form-group">
              <label className="form-label">申诉类型</label>
              <select className="form-select" value={appealType} onChange={e => setAppealType(e.target.value)}>
                <option value="payment">结算问题</option>
                <option value="quality">质量争议</option>
                <option value="communication">沟通问题</option>
                <option value="other">其他问题</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">申诉理由</label>
              <textarea
                className="form-textarea"
                value={appealReason}
                onChange={e => setAppealReason(e.target.value)}
                placeholder="请详细描述您的申诉理由..."
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAppealModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAppeal} disabled={submitting}>
                {submitting ? '提交中...' : '提交申诉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
