import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi, messageApi } from '../api';
import { useOrderStore } from '../store';

const TripPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { setCurrentOrder } = useOrderStore();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tripProgress, setTripProgress] = useState(20);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setTripProgress(prev => Math.min(prev + 2, 100));
    }, 2000);
    return () => clearInterval(progressInterval);
  }, []);

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

        if (newOrder.status === 'completed' || newOrder.status === 'paid' || newOrder.status === 'rated') {
          navigate(`/payment/${orderId}`);
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

  const handleSendMessage = () => {
    const message = prompt('请输入消息内容：');
    if (message) {
      messageApi.sendMessage({
        orderId,
        content: message
      }).then(() => {
        alert('消息已发送');
      }).catch(() => {
        alert('发送失败');
      });
    }
  };

  const handleSimulateTripComplete = async () => {
    try {
      const res = await orderApi.simulateTripComplete(orderId);
      if (res.data.success) {
        alert('行程已结束，请前往支付');
        navigate(`/payment/${orderId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
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
        background: 'linear-gradient(180deg, #07c160 0%, #10b981 100%)', 
        padding: '16px', 
        paddingTop: '50px',
        minHeight: '240px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '20px' }}></div>
          <div style={{ fontWeight: '600' }}>行程进行中</div>
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

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚗</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
            正在前往目的地
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            请系好安全带，注意安全
          </div>
        </div>

        <div style={{ 
          marginTop: '20px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '8px',
          padding: '8px',
          marginLeft: '20px',
          marginRight: '20px'
        }}>
          <div style={{ 
            height: '8px', 
            background: 'rgba(255,255,255,0.3)', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${tripProgress}%`, 
              height: '100%', 
              background: 'white',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '8px',
            fontSize: '12px'
          }}>
            <span>出发</span>
            <span>行程进度 {tripProgress}%</span>
            <span>到达</span>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        margin: '16px', 
        borderRadius: '16px',
        padding: '16px',
        marginTop: '-40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: '#e8f5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            {order?.driver_avatar || '👨'}
          </div>
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>{order?.driver_name}</span>
              <span style={{ color: '#faad14' }}>⭐ {order?.driver_rating}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {order?.car_model} · {order?.car_number} · {order?.car_color}
            </div>
          </div>
        </div>
      </div>

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
            </div>
            <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: '#999' }}>到达</div>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{order?.end_name}</div>
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
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#07c160' }}>
              {order?.distance_km?.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>公里</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#07c160' }}>
              约{Math.max(Math.round(order?.duration_min * (1 - tripProgress / 100)), 1)}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>剩余分钟</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#07c160' }}>
              ¥{order?.estimated_price?.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>预计费用</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', margin: '16px', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
          🛠️ 模拟操作（测试用）
        </div>
        <button
          onClick={handleSimulateTripComplete}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#ff6a00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '24px', 
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          模拟行程结束
        </button>
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
        display: 'flex',
        gap: '12px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '12px', 
          background: '#f5f5f5', 
          borderRadius: '24px',
          cursor: 'pointer'
        }}
        onClick={handleSendMessage}
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
  );
};

export default TripPage;