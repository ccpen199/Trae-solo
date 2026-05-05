import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { userApi, orderApi } from '../services/api';

function OrderHistory() {
  const { DEMO_USER_ID, showNotification, refreshUserInfo } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelPrivilege, setCancelPrivilege] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [DEMO_USER_ID]);

  const fetchOrders = async () => {
    try {
      const response = await userApi.getOrders(DEMO_USER_ID, 50);
      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetail = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setShowModal(true);
    
    try {
      const [detailRes, privilegeRes] = await Promise.all([
        orderApi.getDetail(order.id),
        orderApi.checkCancelPrivilege(DEMO_USER_ID)
      ]);
      
      if (detailRes.data.success) {
        setOrderDetail(detailRes.data.data);
      }
      if (privilegeRes.data.success) {
        setCancelPrivilege(privilegeRes.data.data);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    if (!window.confirm('确定要取消该订单吗？取消后积分和成长值将被回滚。')) {
      return;
    }
    
    setCancelling(true);
    try {
      const response = await orderApi.cancel(
        selectedOrder.id, 
        DEMO_USER_ID, 
        '用户主动取消'
      );
      
      if (response.data.success) {
        showNotification('success', '订单已取消，积分和成长值已回滚');
        
        const refund = response.data.data.refundDetails;
        if (refund.pointsRefunded > 0 || refund.growthRefunded > 0) {
          showNotification('info', 
            `回滚: 积分-${refund.pointsRefunded}, 成长值-${refund.growthRefunded}`
          );
        }
        
        await fetchOrders();
        await refreshUserInfo();
        closeModal();
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      const errorMsg = error.response?.data?.error || error.message || '取消订单失败';
      showNotification('error', errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const formatCurrency = (fen) => {
    return (fen / 100).toFixed(2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'paid': { text: '已支付', class: 'badge-success' },
      'pending': { text: '待支付', class: 'badge-warning' },
      'cancelled': { text: '已取消', class: 'badge-danger' }
    };
    const info = statusMap[status] || { text: status, class: 'badge-info' };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const getBusinessIcon = (code) => {
    const icons = {
      'HOTEL': '🏨',
      'FLIGHT': '✈️',
      'TICKET': '🎫',
      'TRAIN': '🚄',
      'CAR': '🚗',
      'VACATION': '🌴',
      'GROUP_BUY': '🛍️',
      'INSURANCE': '🛡️'
    };
    return icons[code] || '📦';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载订单记录中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <div className="card">
        <div className="card-header">
          订单历史
          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
            共 {orders.length} 条订单
          </span>
          <button 
            className="btn btn-secondary"
            style={{ marginLeft: 'auto' }}
            onClick={fetchOrders}
          >
            刷新
          </button>
        </div>

        {orders.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>业务线</th>
                  <th>原价</th>
                  <th>等级优惠</th>
                  <th>实付金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {order.order_no}
                    </td>
                    <td>
                      <span style={{ marginRight: '6px' }}>
                        {getBusinessIcon(order.code)}
                      </span>
                      {order.business_name}
                    </td>
                    <td>¥{formatCurrency(order.original_amount)}</td>
                    <td>
                      {order.level_discount_amount > 0 ? (
                        <span style={{ color: '#2e7d32' }}>
                          -¥{formatCurrency(order.level_discount_amount)}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#ff6b00' }}>
                      ¥{formatCurrency(order.pay_amount)}
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ fontSize: '12px' }}>{formatDate(order.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => viewOrderDetail(order)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ marginBottom: '8px' }}>暂无订单记录</h3>
            <p>去业务线消费页面下单试试吧</p>
          </div>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="purchase-modal" onClick={closeModal}>
          <div className="purchase-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">订单详情</div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <div className="order-row">
                  <span>订单号</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedOrder.order_no}</span>
                </div>
                <div className="order-row">
                  <span>业务线</span>
                  <span>
                    {getBusinessIcon(selectedOrder.code)} {selectedOrder.business_name}
                  </span>
                </div>
                <div className="order-row">
                  <span>订单状态</span>
                  <span>{getStatusBadge(selectedOrder.status)}</span>
                </div>
                <div className="order-row">
                  <span>创建时间</span>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
                {selectedOrder.payment_time && (
                  <div className="order-row">
                    <span>支付时间</span>
                    <span>{formatDate(selectedOrder.payment_time)}</span>
                  </div>
                )}
                <div className="order-row total">
                  <span>商品原价</span>
                  <span>¥{formatCurrency(selectedOrder.original_amount)}</span>
                </div>
                {selectedOrder.level_discount_amount > 0 && (
                  <div className="order-row discount-row">
                    <span>等级优惠</span>
                    <span>-¥{formatCurrency(selectedOrder.level_discount_amount)}</span>
                  </div>
                )}
                {selectedOrder.other_discount_amount > 0 && (
                  <div className="order-row discount-row">
                    <span>其他优惠</span>
                    <span>-¥{formatCurrency(selectedOrder.other_discount_amount)}</span>
                  </div>
                )}
                <div className="order-row total" style={{ borderTop: '2px solid #eee' }}>
                  <span>实付金额</span>
                  <span style={{ color: '#ff6b00', fontSize: '18px' }}>
                    ¥{formatCurrency(selectedOrder.pay_amount)}
                  </span>
                </div>
              </div>

              {orderDetail && (
                <>
                  {orderDetail.pointTransaction && (
                    <div className="card" style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '12px' }}>💰 积分发放记录</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <p>流水号: {orderDetail.pointTransaction.trans_no}</p>
                        <p>发放积分: <strong style={{ color: '#2e7d32' }}>+{orderDetail.pointTransaction.points}</strong></p>
                        <p>变更前: {orderDetail.pointTransaction.points_before} → 变更后: {orderDetail.pointTransaction.points_after}</p>
                        <p>说明: {orderDetail.pointTransaction.trans_desc}</p>
                      </div>
                    </div>
                  )}

                  {orderDetail.growthRecord && (
                    <div className="card">
                      <div style={{ fontWeight: 600, marginBottom: '12px' }}>✨ 成长值记录</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <p>成长值: <strong style={{ color: '#2e7d32' }}>+{orderDetail.growthRecord.growth_amount}</strong></p>
                        <p>业务线系数: x{orderDetail.growthRecord.business_coefficient}</p>
                        <p>变更前: {orderDetail.growthRecord.growth_before} → 变更后: {orderDetail.growthRecord.growth_after}</p>
                        <p>有效期至: {formatDate(orderDetail.growthRecord.expire_date)}</p>
                      </div>
                    </div>
                  )}

                  {!orderDetail.pointTransaction && !orderDetail.growthRecord && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <p>该订单暂无积分和成长值记录</p>
                    </div>
                  )}
                </>
              )}

              {!orderDetail && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
                  <p style={{ marginTop: '12px', color: '#666' }}>加载更多详情中...</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {cancelPrivilege?.hasPrivilege && selectedOrder?.status === 'paid' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  style={{ 
                    color: '#c62828', 
                    borderColor: '#ffcdd2',
                    background: '#ffebee'
                  }}
                >
                  {cancelling ? '取消中...' : '取消订单'}
                </button>
              )}
              {!cancelPrivilege?.hasPrivilege && selectedOrder?.status === 'paid' && (
                <div style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  color: '#999',
                  padding: '10px'
                }}>
                  🔒 升级到铜骆驼及以上等级可解锁免费取消特权
                </div>
              )}
              <button className="btn btn-secondary" onClick={closeModal} style={{ flex: 1 }}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
