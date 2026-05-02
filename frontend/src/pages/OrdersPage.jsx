import React, { useEffect, useState } from 'react';
import { orderApi } from '../api';
import dayjs from 'dayjs';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const statusMap = {
    pending: { label: '待提交', color: '#9ca3af' },
    submitted: { label: '已提交', color: '#f59e0b' },
    accepted: { label: '已报单', color: '#3b82f6' },
    partially_filled: { label: '部分成交', color: '#8b5cf6' },
    filled: { label: '完全成交', color: '#10b981' },
    cancelled: { label: '已撤销', color: '#6b7280' },
    rejected: { label: '被拒绝', color: '#ef4444' }
  };

  const directionMap = {
    buy: { label: '买入', color: '#ef4444' },
    sell: { label: '卖出', color: '#10b981' }
  };

  useEffect(() => {
    loadOrders();
  }, [status]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders(status);
      setOrders(res.data.orders);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId) => {
    try {
      const res = await orderApi.getOrder(orderId);
      setOrderDetail(res.data);
    } catch (err) {
      console.error('加载订单详情失败:', err);
    }
  };

  const handleCancel = async (order) => {
    if (!confirm('确定要撤销此订单吗？')) return;
    
    try {
      await orderApi.cancelOrder(order.id);
      loadOrders();
      if (selectedOrder?.id === order.id) {
        loadOrderDetail(order.id);
      }
    } catch (err) {
      console.error('撤销订单失败:', err);
      alert(err.response?.data?.error || '撤销失败');
    }
  };

  const formatTime = (timestamp) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  const formatPrice = (price) => (price ? price.toFixed(2) : '--');

  return (
    <div>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span style={{ fontWeight: '500', color: '#374151' }}>订单状态：</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        >
          <option value="">全部</option>
          {Object.entries(statusMap).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <button
          onClick={loadOrders}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          刷新
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            订单列表
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无订单数据</div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>订单号</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>证券</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>方向</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>委托价</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>数量</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>成交</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>状态</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>时间</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      style={{ 
                        cursor: 'pointer',
                        background: selectedOrder?.id === order.id ? '#eff6ff' : 'transparent'
                      }}
                      onClick={() => {
                        setSelectedOrder(order);
                        loadOrderDetail(order.id);
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontFamily: 'monospace' }}>{order.order_no}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        <div style={{ fontWeight: '500' }}>{order.security_code}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.security_name}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: directionMap[order.direction]?.color,
                          background: order.direction === 'buy' ? '#fef2f2' : '#ecfdf5'
                        }}>
                          {directionMap[order.direction]?.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(order.price)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{order.quantity.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>
                        {order.filled_quantity} / {order.quantity}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: statusMap[order.status]?.color,
                          background: '#f9fafb'
                        }}>
                          {statusMap[order.status]?.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280' }}>
                        {formatTime(order.created_at)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {['accepted', 'partially_filled'].includes(order.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(order);
                            }}
                            style={{
                              padding: '4px 12px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            撤销
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            订单详情
          </h3>
          
          {orderDetail ? (
            <div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>订单号</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{orderDetail.order.order_no}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>证券代码</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{orderDetail.order.security_code}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>证券名称</span>
                  <span style={{ fontSize: '14px' }}>{orderDetail.order.security_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>委托方向</span>
                  <span style={{ 
                    color: directionMap[orderDetail.order.direction]?.color,
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {directionMap[orderDetail.order.direction]?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>委托价格</span>
                  <span style={{ fontSize: '14px' }}>¥{formatPrice(orderDetail.order.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>委托数量</span>
                  <span style={{ fontSize: '14px' }}>{orderDetail.order.quantity.toLocaleString()} 股</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>成交数量</span>
                  <span style={{ fontSize: '14px' }}>{orderDetail.order.filled_quantity.toLocaleString()} 股</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>成交金额</span>
                  <span style={{ fontSize: '14px' }}>¥{formatPrice(orderDetail.order.filled_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>订单状态</span>
                  <span style={{ 
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: statusMap[orderDetail.order.status]?.color,
                    background: '#e5e7eb'
                  }}>
                    {statusMap[orderDetail.order.status]?.label}
                  </span>
                </div>
              </div>

              {orderDetail.statusHistory && orderDetail.statusHistory.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>状态流转</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orderDetail.statusHistory.map((history, idx) => (
                      <div key={idx} style={{ 
                        padding: '12px', 
                        background: '#f9fafb', 
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>
                            {history.from_status ? `${statusMap[history.from_status]?.label} → ` : ''}
                            <strong>{statusMap[history.to_status]?.label}</strong>
                          </span>
                          <span style={{ color: '#6b7280' }}>{formatTime(history.timestamp)}</span>
                        </div>
                        {history.reason && (
                          <div style={{ color: '#6b7280' }}>原因: {history.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orderDetail.trades && orderDetail.trades.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>成交记录</h4>
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>成交号</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>价格</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>数量</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetail.trades.map((trade) => (
                          <tr key={trade.id}>
                            <td style={{ padding: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{trade.trade_no}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{formatPrice(trade.price)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{trade.quantity.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{formatPrice(trade.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div>请选择订单查看详情</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
