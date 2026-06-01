import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const statusMap = {
  pending: { text: '待支付', color: '#ff9500' },
  paid: { text: '已支付', color: '#52c41a' },
  confirmed: { text: '商家确认', color: '#1890ff' },
  expired: { text: '已过期', color: '#999' },
  cancelled: { text: '已取消', color: '#f5222d' }
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  async function loadOrders() {
    const res = await fetch('/api/orders').then(r => r.json());
    if (res.success) {
      let list = res.data.list || [];
      if (activeTab !== 'all') {
        list = list.filter(o => o.status === activeTab);
      }
      setOrders(list);
    }
    setLoading(false);
  }

  async function handleCancel(id) {
    if (confirm('确定取消订单吗？')) {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      loadOrders();
    }
  }

  async function handlePay(id) {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    });
    loadOrders();
  }

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="orders-page">
      <h2 className="section-title">📋 我的订单</h2>
      
      <div className="order-tabs">
        {['all', 'pending', 'paid', 'confirmed'].map(tab => (
          <div
            key={tab}
            className={`order-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? '全部' : statusMap[tab]?.text}
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty">暂无订单</div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <span>订单号：{order.order_no}</span>
              <span style={{ color: statusMap[order.status]?.color, fontWeight: '500' }}>
                {statusMap[order.status]?.text}
              </span>
            </div>
            
            <div className="order-product">
              <div></div>
              <div className="order-product-info">
                <h4>三亚5日4晚自由行</h4>
                <p>标准套餐</p>
                <p>{order.traveler_count || 1}人出行</p>
              </div>
            </div>
            
            <div className="order-footer">
              <div className="order-total">
                合计：<span>¥{order.total_price || order.price}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {order.status === 'pending' && (
                  <>
                    <button className="btn btn-outline" onClick={() => handleCancel(order.id)}>取消</button>
                    <button className="btn btn-primary" onClick={() => handlePay(order.id)} style={{ padding: '8px 16px', width: 'auto' }}>去支付</button>
                  </>
                )}
                <Link to={`/order-result/${order.id}`} className="btn btn-outline">查看详情</Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
