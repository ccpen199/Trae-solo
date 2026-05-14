import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function PaySuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    if (location.state) {
      setOrderInfo(location.state);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!orderInfo) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
      <h2 style={{ color: '#52c41a', marginBottom: '20px' }}>支付成功！</h2>

      <div className="card" style={{ textAlign: 'left', marginTop: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>订单信息</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ color: '#666' }}>订单号:</span>
          <span style={{ fontFamily: 'monospace' }}>{orderInfo.orderId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ color: '#666' }}>支付金额:</span>
          <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>¥{orderInfo.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {orderInfo.generatedCoupons && orderInfo.generatedCoupons.length > 0 && (
        <div className="card" style={{ marginTop: '20px', textAlign: 'left', background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)', color: 'white' }}>
          <h3 style={{ marginBottom: '16px' }}>🎁 获得优惠券</h3>
          {orderInfo.generatedCoupons.map((coupon, index) => (
            <div key={index} style={{ padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>¥{coupon.amount}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>{coupon.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>券码: {coupon.code}</div>
            </div>
          ))}
          <p style={{ fontSize: '12px', marginTop: '12px', opacity: 0.8 }}>
            优惠券已放入您的账户，可在"我的优惠券"中查看
          </p>
        </div>
      )}

      <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
        <button
          className="btn"
          onClick={() => navigate('/')}
          style={{ flex: 1 }}
        >
          返回首页
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/coupons')}
          style={{ flex: 1 }}
        >
          查看优惠券
        </button>
      </div>

      <div className="card" style={{ marginTop: '20px', textAlign: 'left' }}>
        <h4 style={{ marginBottom: '12px' }}>💡 温馨提示</h4>
        <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
          <li>支付后获得的优惠券可直接使用</li>
          <li>分享优惠券给好友，好友领取后您可获得更多优惠</li>
          <li>每成功支付一次，即可获得一次分享红包的机会</li>
        </ul>
      </div>
    </div>
  );
}

export default PaySuccess;
