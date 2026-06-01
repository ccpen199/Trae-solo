import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function OrderResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    const res = await fetch('/api/orders').then(r => r.json());
    if (res.success) {
      const found = res.data.list.find(o => o.id == id);
      setOrder(found || { id, order_no: 'ORD' + Date.now(), total_price: 2999, status: 'pending' });
    }
    setLoading(false);
  }

  async function handlePay() {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    });
    loadOrder();
  }

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="order-result">
      <div className="order-success-icon">✅</div>
      <h2>预订成功</h2>
      <p className="order-no">订单号：{order?.order_no}</p>
      
      <div className="order-card" style={{ maxWidth: '500px', margin: '20px auto', textAlign: 'left' }}>
        <div className="order-product">
          <div></div>
          <div className="order-product-info">
            <h4>三亚5日4晚自由行</h4>
            <p>标准套餐</p>
            <p>出行人数：{order?.traveler_count || 1} 人</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', paddingTop: '12px', borderTop: '1px solid #eee' }}>
          <span>订单金额：</span>
          <span style={{ color: 'var(--primary-color)', fontSize: '20px', fontWeight: 'bold' }}>¥{order?.total_price || 2999}</span>
        </div>
      </div>

      <div className="order-actions">
        <Link to="/orders" className="btn btn-outline">查看订单</Link>
        {order?.status === 'pending' && (
          <button className="btn btn-primary" onClick={handlePay} style={{ width: 'auto', padding: '12px 32px' }}>
            立即支付
          </button>
        )}
        <Link to="/" className="btn btn-outline">继续逛逛</Link>
      </div>

      <div className="share-section" style={{ maxWidth: '500px', margin: '30px auto' }}>
        <button className="share-btn" onClick={() => alert('分享给好友')}>📤 分享给好友</button>
        <button className="share-btn" onClick={() => alert('生成海报')}>🖼️ 生成海报</button>
      </div>
    </div>
  );
}
