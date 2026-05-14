import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi, paymentApi } from '../api';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('balance');

  const paymentMethods = [
    { id: 'balance', name: '余额支付', icon: '💰', desc: '账户余额', disabled: false },
    { id: 'wechat', name: '微信支付', icon: '💚', desc: '微信支付', disabled: false },
    { id: 'alipay', name: '支付宝', icon: '💙', desc: '支付宝', disabled: false },
  ];

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderApi.getOrderById(orderId);
      if (res.data.success) {
        setOrder(res.data.data);
        
        if (res.data.data.status === 'paid' || res.data.data.status === 'rated') {
          navigate(`/rating/${orderId}`);
        }
      }
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      setPaying(true);
      const res = await paymentApi.payOrder({
        orderId,
        paymentMethod
      });
      
      if (res.data.success) {
        alert('支付成功！');
        navigate(`/rating/${orderId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || '支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '120px' }}>
      <div style={{ 
        background: 'linear-gradient(180deg, #ff6a00 0%, #ff8a33 100%)', 
        padding: '16px', 
        paddingTop: '50px',
        minHeight: '200px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            onClick={() => navigate(-1)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ flex: 1, fontWeight: '600' }}>支付订单</div>
          <div style={{ width: '20px' }}></div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>支付金额</div>
          <div style={{ fontSize: '48px', fontWeight: '700', marginTop: '8px' }}>
            ¥{order?.actual_price?.toFixed(2) || order?.estimated_price?.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px', marginTop: '-30px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>订单信息</div>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: '#07c160' 
            }}></div>
            <div style={{ width: '2px', height: '30px', background: '#e0e0e0' }}></div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px', 
              background: '#ff6a00' 
            }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '500' }}>{order?.start_name}</div>
            <div style={{ height: '1px', background: '#f0f0f0', margin: '6px 0' }}></div>
            <div style={{ fontWeight: '500' }}>{order?.end_name}</div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '16px', 
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <span style={{ color: '#999' }}>车型</span>
          <span>{order?.car_type_name}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '12px'
        }}>
          <span style={{ color: '#999' }}>距离</span>
          <span>{order?.distance_km?.toFixed(1)} 公里</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '12px'
        }}>
          <span style={{ color: '#999' }}>时长</span>
          <span>约 {order?.duration_min} 分钟</span>
        </div>
      </div>

      <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>支付方式</div>
        
        {paymentMethods.map(method => (
          <div
            key={method.id}
            onClick={() => !method.disabled && setPaymentMethod(method.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              opacity: method.disabled ? 0.5 : 1,
              cursor: method.disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <div style={{ fontSize: '24px', marginRight: '12px' }}>{method.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500' }}>{method.name}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                {method.desc}
              </div>
            </div>
            {paymentMethod === method.id ? (
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#ff6a00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>✓</div>
            ) : (
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                border: '2px solid #ccc'
              }}></div>
            )}
          </div>
        ))}
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        maxWidth: '480px',
        margin: '0 auto',
        background: 'white',
        padding: '16px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#999' }}>合计</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ff6a00' }}>
              ¥{order?.actual_price?.toFixed(2) || order?.estimated_price?.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            style={{ 
              padding: '14px 40px', 
              background: paying ? '#ccc' : '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: paying ? 'not-allowed' : 'pointer'
            }}
          >
            {paying ? '支付中...' : '确认支付'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;