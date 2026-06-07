import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';

const RiderOrders = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let url = activeTab === 'pending' ? '/orders/available' : `/orders/my?status=${activeTab}`;
      const res = await api.get(url);
      setOrders(res.data);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/accept`);
      setMessage({ type: 'success', text: `接单成功！预计收入 ¥${res.data.riderFee}` });
      setTimeout(() => {
        setActiveTab('accepted');
        loadOrders();
      }, 1000);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '接单失败' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-info',
      accepted: 'badge-warning',
      picked: 'badge-warning',
      delivered: 'badge-success',
      settled: 'badge-success',
      exception: 'badge-error'
    };
    return badges[status] || 'badge-default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待接单',
      accepted: '待取餐',
      picked: '配送中',
      delivered: '已送达',
      settled: '已结算',
      exception: '异常'
    };
    return texts[status] || status;
  };

  const tabs = [
    { key: 'pending', label: '可接订单' },
    { key: 'accepted', label: '待取餐' },
    { key: 'picked', label: '配送中' },
    { key: 'delivered', label: '已完成' }
  ];

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>订单大厅</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          暂无订单
        </div>
      )}

      {orders.map(order => (
        <div key={order.id} className="card order-card">
          <div className="order-header">
            <div>
              <span className="order-no">{order.order_no}</span>
              <span className={`badge ${getStatusBadge(order.status)}`} style={{ marginLeft: '12px' }}>
                {getStatusText(order.status)}
              </span>
            </div>
            <div className="order-amount">¥{order.rider_fee || order.total_fee}</div>
          </div>

          <div className="order-info">
            📍 取餐：{order.merchant_name} - {order.merchant_address}
          </div>
          <div className="order-info">
            🏠 送餐：{order.customer_address}
          </div>
          <div className="order-info">
            📦 {order.goods_description}
          </div>
          <div className="order-info" style={{ color: 'var(--text-secondary)' }}>
            距离约 {(order.estimated_distance / 1000).toFixed(1)} 公里 · 预计 {order.estimated_duration} 分钟
          </div>

          <div className="order-actions">
            {activeTab === 'pending' && (
              <button className="btn btn-success btn-block" onClick={() => acceptOrder(order.id)}>
                立即接单
              </button>
            )}
            {activeTab !== 'pending' && (
              <button className="btn btn-primary btn-block" onClick={() => navigate(`/rider/orders/${order.id}`)}>
                查看详情
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RiderOrders;
