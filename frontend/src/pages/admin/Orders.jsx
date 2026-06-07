import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    merchant_name: '',
    merchant_address: '',
    merchant_lat: 39.9,
    merchant_lng: 116.4,
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_lat: 39.91,
    customer_lng: 116.41,
    goods_description: '',
    estimated_distance: 1500,
    estimated_duration: 20,
    base_fee: 8,
    tip_fee: 0
  });

  useEffect(() => {
    loadOrders();
  }, [status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = status ? `/platform/orders?status=${status}` : '/platform/orders';
      const res = await api.get(url);
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/dispatch`);
      if (res.data.success && res.data.bestMatch) {
        setMessage({
          type: 'success',
          text: `派单完成！最佳匹配：${res.data.bestMatch.rider_name}，得分 ${res.data.bestMatch.score}，距离 ${res.data.bestMatch.distance}米，共 ${res.data.totalCandidates} 名候选骑手`
        });
      } else {
        setMessage({ type: 'warning', text: res.data.error || '没有找到合适的骑手' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '派单失败' });
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/orders', newOrder);
      setMessage({ type: 'success', text: `订单创建成功：${res.data.orderNo}` });
      setShowCreateModal(false);
      loadOrders();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '创建失败' });
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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📦 订单管理</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 模拟下单</button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        <div className={`tab-item ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>全部</div>
        <div className={`tab-item ${status === 'pending' ? 'active' : ''}`} onClick={() => setStatus('pending')}>待接单</div>
        <div className={`tab-item ${status === 'accepted' ? 'active' : ''}`} onClick={() => setStatus('accepted')}>待取餐</div>
        <div className={`tab-item ${status === 'picked' ? 'active' : ''}`} onClick={() => setStatus('picked')}>配送中</div>
        <div className={`tab-item ${status === 'delivered' ? 'active' : ''}`} onClick={() => setStatus('delivered')}>已完成</div>
        <div className={`tab-item ${status === 'exception' ? 'active' : ''}`} onClick={() => setStatus('exception')}>异常</div>
      </div>

      {loading && <div className="spinner" />}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>商家</th>
              <th>顾客</th>
              <th>金额</th>
              <th>骑手</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mask">{o.order_no}</td>
                <td>{o.merchant_name}</td>
                <td>{o.customer_name}</td>
                <td>¥{o.total_fee}</td>
                <td>{o.rider_name || '-'}</td>
                <td><span className={`badge ${getStatusBadge(o.status)}`}>{getStatusText(o.status)}</span></td>
                <td>
                  {o.status === 'pending' && (
                    <button className="btn btn-primary" onClick={() => handleDispatch(o.id)}>智能派单</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>暂无订单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          overflowY: 'auto', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="card-title">模拟创建订单</h3>
            <form onSubmit={handleCreateOrder}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">商家名称</label>
                  <input type="text" className="form-input" value={newOrder.merchant_name}
                    onChange={(e) => setNewOrder({ ...newOrder, merchant_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">顾客姓名</label>
                  <input type="text" className="form-input" value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">商家地址</label>
                <input type="text" className="form-input" value={newOrder.merchant_address}
                  onChange={(e) => setNewOrder({ ...newOrder, merchant_address: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">顾客地址</label>
                <input type="text" className="form-input" value={newOrder.customer_address}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_address: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">顾客手机号</label>
                <input type="text" className="form-input mask" value={newOrder.customer_phone}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">商品描述</label>
                <input type="text" className="form-input" value={newOrder.goods_description}
                  onChange={(e) => setNewOrder({ ...newOrder, goods_description: e.target.value })} />
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">配送距离(米)</label>
                  <input type="number" className="form-input" value={newOrder.estimated_distance}
                    onChange={(e) => setNewOrder({ ...newOrder, estimated_distance: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">基础配送费(元)</label>
                  <input type="number" className="form-input" value={newOrder.base_fee}
                    onChange={(e) => setNewOrder({ ...newOrder, base_fee: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">小费(元)</label>
                  <input type="number" className="form-input" value={newOrder.tip_fee}
                    onChange={(e) => setNewOrder({ ...newOrder, tip_fee: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-block" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary btn-block">创建订单</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
