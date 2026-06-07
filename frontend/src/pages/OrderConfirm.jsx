import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderAPI } from '../api/client';

function OrderConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await orderAPI.get(id);
      setOrder(data);
    } catch (e) {
      console.error('Load order failed:', e);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      await orderAPI.pay(id, { payment_method: 'online' });
      navigate(`/order/${id}`);
    } catch (e) {
      alert(e.error || '支付失败');
      setLoading(false);
    }
  };

  if (!order) return <div>加载中...</div>;

  return (
    <div className="detail-page">
      <h2 style={{ marginBottom: '2rem' }}>确认订单</h2>
      
      <div className="user-card">
        <h3 style={{ marginBottom: '1rem' }}>{order.event_title}</h3>
        <p style={{ color: '#666' }}>
          {dayjs(order.start_time).format('YYYY年MM月DD日 HH:mm')} | {order.venue_name}
        </p>
      </div>

      <div className="user-card">
        <h4 style={{ marginBottom: '1rem' }}>座位信息</h4>
        {order.items?.map((item) => (
          <div key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            {item.row_label}排{item.seat_number}座 - ¥{item.price}
          </div>
        ))}
      </div>

      <div className="user-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem' }}>订单总额</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
            ¥{order.total_amount}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          取消
        </button>
        <button className="btn btn-primary" onClick={handlePay} disabled={loading}>
          {loading ? '处理中...' : '立即支付'}
        </button>
      </div>
    </div>
  );
}

export default OrderConfirm;
