import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const STATUS_MAP = {
  pending: { text: '待接单', class: 'status-pending' },
  accepted: { text: '已接单', class: 'status-accepted' },
  picked: { text: '已取货', class: 'status-picked' },
  delivered: { text: '已送达', class: 'status-delivered' },
  completed: { text: '已完成', class: 'status-completed' },
  cancelled: { text: '已取消', class: 'status-pending' }
};

export default function MyOrders() {
  const { userType } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/orders/my', { params });
      setOrders(res.data.orders);
    } catch (err) {
      console.error('获取订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待接单' },
    { value: 'accepted', label: '已接单' },
    { value: 'picked', label: '运输中' },
    { value: 'delivered', label: '待确认' },
    { value: 'completed', label: '已完成' }
  ];

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>我的订单</h2>
          {userType === 'shipper' && (
            <Link to="/create-order" className="btn btn-primary">
              + 发布新订单
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: filter === tab.value ? '#1677ff' : '#f5f5f5',
                color: filter === tab.value ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p>暂无订单</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {orders.map(order => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              return (
                <Link 
                  key={order.id} 
                  to={`/orders/${order.id}`}
                  className="card"
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 500 }}>{order.order_no}</span>
                        <span className={`status-badge ${status.class}`}>{status.text}</span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        <span>🚚</span> {order.start_address}
                        <span style={{ margin: '0 8px' }}>→</span>
                        <span>📍</span> {order.end_address}
                      </div>
                      <div style={{ fontSize: '13px', color: '#999' }}>
                        {order.vehicle_type} · {order.cargo_type} · {order.distance}公里
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                        ¥{order.price}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
