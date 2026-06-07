import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderAPI } from '../api/client';

function OrderDetail() {
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

  const handleRefund = async () => {
    if (!confirm('确定要申请退票吗？退款将根据退票政策收取手续费。')) return;
    
    setLoading(true);
    try {
      const result = await orderAPI.refund(id);
      alert(`退票成功！退款金额：¥${result.refund_amount.toFixed(2)}，手续费：¥${result.fee_amount.toFixed(2)}`);
      loadOrder();
    } catch (e) {
      alert(e.error || '退票失败');
    }
    setLoading(false);
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: '待支付',
      paid: '已支付',
      refunded: '已退票',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  if (!order) return <div>加载中...</div>;

  return (
    <div className="detail-page">
      <h2 style={{ marginBottom: '2rem' }}>订单详情</h2>
      
      <div className="user-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{order.event_title}</h3>
          <span className={`status-badge ${order.status === 'paid' ? 'status-onsale' : order.status === 'refunded' ? 'status-soldout' : 'status-presale'}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          {dayjs(order.start_time).format('YYYY年MM月DD日 HH:mm')} | {order.venue_name}，{order.city}
        </p>
      </div>

      <div className="user-card">
        <h4 style={{ marginBottom: '1rem' }}>票券信息</h4>
        {order.items?.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '1rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              cursor: item.ticket_id ? 'pointer' : 'default',
            }}
            onClick={() => item.ticket_id && navigate(`/ticket/${item.ticket_id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.row_label}排{item.seat_number}座</span>
              <span>¥{item.price}</span>
            </div>
            {item.ticket_id && (
              <div style={{ marginTop: '0.5rem', color: '#667eea', fontSize: '0.9rem' }}>
                点击查看票券 →
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="user-card">
        <h4 style={{ marginBottom: '1rem' }}>订单信息</h4>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#666' }}>订单编号</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{order.id}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#666' }}>创建时间</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#666' }}>支付时间</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                {order.payment_time ? dayjs(order.payment_time).format('YYYY-MM-DD HH:mm') : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#666', fontWeight: 'bold' }}>订单金额</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 'bold', fontSize: '1.25rem', color: '#667eea' }}>
                ¥{order.total_amount}
              </td>
            </tr>
            {order.status === 'refunded' && (
              <tr>
                <td style={{ padding: '0.5rem 0', color: '#666' }}>退款金额</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#28a745' }}>
                  ¥{order.refund_amount?.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {order.status === 'paid' && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={handleRefund} disabled={loading}>
            {loading ? '处理中...' : '申请退票'}
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
