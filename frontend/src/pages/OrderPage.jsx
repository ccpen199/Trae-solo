import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../components/TabBar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function OrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.get('/orders').then(res => setOrders(res.data));
  }, [user]);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '70px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        background: '#fff',
        borderBottom: '1px solid #eee'
      }}>
        <span style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>我的订单</span>
        <span style={{ width: '24px' }}></span>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <span style={{ fontSize: '64px' }}>📦</span>
          <p style={{ color: '#999', marginTop: '20px' }}>暂无订单</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{ background: '#fff', marginTop: '10px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>订单号: {order.id}</span>
              <span style={{ color: '#ff6b35' }}>{order.status}</span>
            </div>
            <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span>共 {order.items?.length || 0} 件商品</span>
                <span>实付: <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>¥{order.total_amount}</span></span>
              </div>
            </div>
          </div>
        ))
      )}

      <TabBar />
    </div>
  );
}

export default OrderPage;
