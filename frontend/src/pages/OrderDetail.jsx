import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

function OrderDetail({ currentUser, onRefresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [availableActions, setAvailableActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadOrderDetail();
    loadUsers();
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const [orderResponse, actionsResponse] = await Promise.all([
        api.getOrder(id),
        api.getAvailableActions(id)
      ]);

      if (orderResponse.success) setOrder(orderResponse.data);
      if (actionsResponse.success) setAvailableActions(actionsResponse.data);
    } catch (error) {
      console.error('加载订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success) setUsers(response.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleAction = async (action) => {
    try {
      let result;
      
      switch (action) {
        case 'start_recognition':
          result = await api.recognize(id, { recognitionType: 'both' }, currentUser);
          if (result.success) {
            setMessage({ type: 'success', text: '识别执行成功！' });
          }
          break;
          
        case 'save_share':
          setShowModal('saveShare');
          return;
          
        case 'submit_approval':
          result = await api.submitApproval(id, currentUser);
          if (result.success) {
            setMessage({ type: 'success', text: '已提交审批！' });
          }
          break;
          
        case 'approve':
          setShowModal('approve');
          return;
          
        case 'reject':
          setShowModal('reject');
          return;
          
        case 'place_order':
          result = await api.placeOrder(id, currentUser);
          if (result.success) {
            setMessage({ type: 'success', text: '下单成功！' });
          }
          break;
          
        case 'reassign':
          setShowModal('reassign');
          return;
          
        default:
          break;
      }
      
      if (result) {
        if (!result.success) {
          setMessage({ type: 'error', text: result.message || '操作失败' });
        } else {
          setTimeout(() => {
            loadOrderDetail();
            if (onRefresh) onRefresh();
          }, 500);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      setMessage({ type: 'error', text: error.message || '操作失败' });
    }
  };

  const handleSubmitModal = async () => {
    try {
      let result;
      
      switch (showModal) {
        case 'saveShare':
          result = await api.saveShare(id, {
            screenshotIds: formData.screenshotIds || [],
            sharePlatforms: formData.sharePlatforms || [],
            comment: formData.comment
          }, currentUser);
          break;
          
        case 'approve':
          result = await api.approve(id, {
            comment: formData.comment
          }, currentUser);
          break;
          
        case 'reject':
          result = await api.reject(id, {
            reason: formData.reason,
            comment: formData.comment
          }, currentUser);
          break;
          
        case 'reassign':
          result = await api.reassign(id, formData.newResponsiblePerson, currentUser);
          break;
          
        default:
          break;
      }
      
      if (result?.success) {
        setMessage({ type: 'success', text: '操作成功！' });
        setShowModal(null);
        setFormData({});
        setTimeout(() => {
          loadOrderDetail();
          if (onRefresh) onRefresh();
        }, 500);
      } else {
        setMessage({ type: 'error', text: result?.message || '操作失败' });
      }
    } catch (error) {
      console.error('提交失败:', error);
      setMessage({ type: 'error', text: error.message || '操作失败' });
    }
  };

  const handleCancelOrder = async () => {
    if (window.confirm('确定要取消该订单吗？')) {
      try {
        const result = await api.cancelOrder(id, currentUser);
        if (result.success) {
          setMessage({ type: 'success', text: '订单已取消！' });
          setTimeout(() => {
            loadOrderDetail();
            if (onRefresh) onRefresh();
          }, 500);
        } else {
          setMessage({ type: 'error', text: result.message || '操作失败' });
        }
      } catch (error) {
        console.error('取消订单失败:', error);
        setMessage({ type: 'error', text: error.message || '操作失败' });
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!order) {
    return (
      <div className="card empty">
        订单不存在
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-default" onClick={() => navigate('/orders')}>
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-default" onClick={() => navigate('/orders')}>
          ← 返回
          </button>
          <h2 style={{ margin: 0 }}>订单详情</h2>
        </div>
        <span className={`status-badge status-${order.status}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="row">
        <div className="col">
          <div className="card">
            <h2>订单信息</h2>
            <table className="table">
              <tbody>
                <tr>
                  <td style={{ width: 120, color: '#666' }}>订单号</td>
                  <td style={{ fontWeight: 500 }}>{order.order_no}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666' }}>消费者</td>
                  <td>{order.consumer_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666' }}>订单状态</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666' }}>总金额</td>
                  <td style={{ fontWeight: 500, color: '#ff4d4f', fontSize: 18 }}>
                    ¥{order.total_amount || 0}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666' }}>创建时间</td>
                  <td>{dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666' }}>更新时间</td>
                  <td>{dayjs(order.updated_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {order.details && order.details.length > 0 && (
            <div className="card">
              <h2>商品明细</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>商品名称</th>
                    <th>SKU</th>
                    <th>单价</th>
                    <th>数量</th>
                    <th>小计</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {order.details.map((detail) => (
                    <tr key={detail.id}>
                      <td style={{ fontWeight: 500 }}>{detail.product_name}</td>
                      <td>{detail.sku}</td>
                      <td>¥{detail.unit_price}</td>
                      <td>{detail.quantity}</td>
                      <td style={{ fontWeight: 500 }}>¥{detail.subtotal}</td>
                      <td>
                        <span className={`status-badge status-${detail.status}`}>
                          {detail.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col">
          <div className="card">
            <h2>可用操作</h2>
            {availableActions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {availableActions.map((action) => (
                  <button
                    key={action.action}
                    className={`btn ${
                      action.action === 'approve' ? 'btn-success' :
                      action.action === 'reject' ? 'btn-danger' :
                      'btn-primary'
                    }`}
                    onClick={() => handleAction(action.action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ padding: 20 }}>
              暂无可执行操作
            </div>
            )}
            
            {!['cancelled', 'reversed', 'completed', 'paid', 'shipped', 'order_placed'].includes(order.status) && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <button className="btn btn-default" onClick={handleCancelOrder}>
                取消订单
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h2>状态时间线</h2>
            {order.timeline && order.timeline.length > 0 ? (
              <div className="timeline">
                {order.timeline.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-time">
                    {dayjs(item.created_at || item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                  <div className="timeline-title">
                    {item.timelineType === 'status' ? (
                    <span>状态变更: {getStatusLabel(item.from_status)} → {getStatusLabel(item.to_status)}</span>
                  ) : (
                    <span>{item.action === 'approve' ? '审批通过' : item.action === 'reject' ? '审批驳回' : item.action}</span>
                  )}
                  </div>
                  {item.operator_name && (
                    <div className="timeline-content">
                      操作人: {item.operator_name} ({item.operator_role})
                    </div>
                  )}
                  {item.reason && (
                    <div className="timeline-content">
                      原因: {item.reason}
                    </div>
                  )}
                  {item.comment && (
                    <div className="timeline-content">
                      备注: {item.comment}
                    </div>
                  )}
                </div>
              ))}
              </div>
            ) : (
              <div className="empty" style={{ padding: 20 }}>
              暂无状态记录
            </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {showModal === 'saveShare' && '保存分享'}
                {showModal === 'approve' && '审批通过'}
                {showModal === 'reject' && '审批驳回'}
                {showModal === 'reassign' && '转派订单'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {showModal === 'saveShare' && (
                <>
                  <div className="form-group">
                    <label>备注</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="请输入备注信息..."
                      value={formData.comment || ''}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              {showModal === 'approve' && (
                <div className="form-group">
                  <label>审批意见</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="请输入审批意见..."
                    value={formData.comment || ''}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  />
                </div>
              )}
              
              {showModal === 'reject' && (
                <>
                  <div className="form-group">
                    <label>驳回原因</label>
                    <select
                      className="form-control"
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    >
                      <option value="">请选择驳回原因</option>
                      <option value="stock_shortage">库存不足</option>
                      <option value="quality_issue">商品质量问题</option>
                      <option value="info_missing">资料不全</option>
                      <option value="other">其他原因</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>备注说明</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="请输入备注说明..."
                      value={formData.comment || ''}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              {showModal === 'reassign' && (
                <div className="form-group">
                  <label>选择新的责任人</label>
                  <select
                    className="form-control"
                    value={formData.newResponsiblePerson || ''}
                    onChange={(e) => setFormData({ ...formData, newResponsiblePerson: e.target.value })}
                  >
                    <option value="">请选择责任人</option>
                    {users.filter(u => ['guide', 'operator', 'brand'].includes(u.role)).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({getRoleLabel(user.role)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(null)}>
              取消
              </button>
              <button
                className={`btn ${
                  showModal === 'reject' ? 'btn-danger' : 'btn-primary'
                }`}
                onClick={handleSubmitModal}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    camera_opened: '摄像头已打开',
    pending_recognition: '待识别',
    recognition_in_progress: '识别中',
    recognition_completed: '识别完成',
    pending_tryon: '待试穿',
    tryon_in_progress: '试穿中',
    tryon_completed: '试穿完成',
    shared: '已分享',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    order_placed: '已下单',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    reversed: '已逆向'
  };
  return labels[status] || status;
}

function getRoleLabel(role) {
  const labels = {
    consumer: '消费者',
    guide: '导购',
    operator: '运营',
    brand: '品牌管理员'
  };
  return labels[role] || role;
}

export default OrderDetail;
