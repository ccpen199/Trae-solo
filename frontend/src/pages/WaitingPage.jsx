import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi, messageApi } from '../api';
import { useOrderStore } from '../store';

const WaitingPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { setCurrentOrder } = useOrderStore();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [driverAssigned, setDriverAssigned] = useState(false);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    const unreadInterval = setInterval(checkUnreadMessages, 5000);
    return () => clearInterval(unreadInterval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderApi.getOrderById(orderId);
      if (res.data.success) {
        const newOrder = res.data.data;
        setOrder(newOrder);
        setCurrentOrder(newOrder);
        
        if (newOrder.driver_id && !driverAssigned) {
          setDriverAssigned(true);
          setCountdown(3);
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }

        if (newOrder.status === 'in_progress') {
          navigate(`/trip/${orderId}`);
        }
      }
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      const res = await messageApi.getUnreadCount();
      if (res.data.success) {
        setUnreadCount(res.data.data.unread_count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateDriverArrive = async () => {
    try {
      const res = await orderApi.simulateDriverArrive(orderId);
      if (res.data.success) {
        alert('司机已到达，行程开始！');
        navigate(`/trip/${orderId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleSendMessage = () => {
    const message = prompt('请输入消息内容：');
    if (message) {
      messageApi.sendMessage({
        orderId,
        content: message
      }).then(() => {
        alert('消息已发送，司机可能会自动回复您。');
      }).catch(() => {
        alert('发送失败');
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('确定要取消订单吗？')) return;
    try {
      const res = await orderApi.updateStatus(orderId, 'cancelled');
      if (res.data.success) {
        alert('订单已取消');
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || '取消失败');
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
        minHeight: '280px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            onClick={() => navigate('/')}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ fontWeight: '600' }}>等待接驾</div>
          <div 
            onClick={() => navigate(`/chat/${orderId}`)}
            style={{ position: 'relative', fontSize: '20px', cursor: 'pointer' }}
          >
            💬
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>
            {order?.driver_id ? '🚗' : '🔄'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            {order?.driver_id ? '司机已接单' : '正在为您派单'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {order?.driver_id 
              ? `预计 ${order?.duration_min || 5} 分钟后到达`
              : '请稍候，正在为您匹配附近的司机'
            }
          </div>
        </div>
      </div>

      {order?.driver_id && (
        <div style={{ 
          background: 'white', 
          margin: '16px', 
          borderRadius: '16px',
          padding: '16px',
          marginTop: '-60px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: '#fff5ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              {order.driver_avatar || '👨'}
            </div>
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{order.driver_name}</span>
                <span style={{ color: '#faad14' }}>⭐ {order.driver_rating}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                {order.car_model} · {order.car_number}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {order.car_color}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', color: '#ff6a00', fontWeight: '600' }}>
                {countdown > 0 ? countdown : '3'}
              </div>
              <div style={{ fontSize: '10px', color: '#999' }}>分钟</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '24px',
              cursor: 'pointer'
            }}
            onClick={() => handleSendMessage()}
            >
              💬 发消息
            </div>
            <div style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '24px',
              cursor: 'pointer'
            }}
            >
              📞 打电话
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>行程信息</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: '#07c160' 
            }}></div>
            <div style={{ width: '2px', height: '40px', background: '#e0e0e0' }}></div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px', 
              background: '#ff6a00' 
            }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999' }}>出发</div>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{order?.start_name}</div>
              {order?.start_address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {order.start_address}
                </div>
              )}
            </div>
            <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: '#999' }}>到达</div>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{order?.end_name}</div>
              {order?.end_address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {order.end_address}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          marginTop: '16px', 
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ff6a00' }}>
              {order?.distance_km?.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>公里</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ff6a00' }}>
              约{order?.duration_min}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>分钟</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ff6a00' }}>
              ¥{order?.estimated_price?.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>预计费用</div>
          </div>
        </div>
      </div>

      {order?.status === 'accepted' && (
        <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
            🛠️ 模拟操作（测试用）
          </div>
          <button
            onClick={handleSimulateDriverArrive}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#07c160', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            模拟司机到达并开始行程
          </button>
        </div>
      )}

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
        <button
          onClick={handleCancelOrder}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: '#f5f5f5', 
            color: '#666', 
            border: 'none', 
            borderRadius: '24px', 
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          取消订单
        </button>
      </div>
    </div>
  );
};

export default WaitingPage;