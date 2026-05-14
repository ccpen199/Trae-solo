import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'completed', label: '已完成' },
    { id: 'paid', label: '待评价' },
    { id: 'cancelled', label: '已取消' },
  ];

  useEffect(() => {
    loadOrders();
  }, [activeFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const res = await orderApi.getOrderHistory(params);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: '待接单', color: '#faad14' };
      case 'accepted':
        return { text: '已接单', color: '#1890ff' };
      case 'in_progress':
        return { text: '行程中', color: '#07c160' };
      case 'completed':
        return { text: '已完成', color: '#666' };
      case 'paid':
        return { text: '待评价', color: '#ff6a00' };
      case 'rated':
        return { text: '已评价', color: '#666' };
      case 'cancelled':
        return { text: '已取消', color: '#999' };
      default:
        return { text: status, color: '#666' };
    }
  };

  const handleOrderClick = (order) => {
    if (order.status === 'pending' || order.status === 'accepted') {
      navigate(`/waiting/${order.id}`);
    } else if (order.status === 'in_progress') {
      navigate(`/trip/${order.id}`);
    } else if (order.status === 'completed') {
      navigate(`/payment/${order.id}`);
    } else if (order.status === 'paid') {
      navigate(`/rating/${order.id}`);
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>我的订单</div>
        <div style={{ width: '20px' }}></div>
      </div>

      <div style={{ 
        background: 'white', 
        display: 'flex',
        padding: '0 12px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {filters.map((filter) => (
          <div
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '12px 0',
              cursor: 'pointer',
              borderBottom: activeFilter === filter.id ? '2px solid #ff6a00' : 'none',
              color: activeFilter === filter.id ? '#ff6a00' : '#666',
              fontWeight: activeFilter === filter.id ? '600' : '400',
              fontSize: '14px'
            }}
          >
            {filter.label}
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '16px' }}>暂无订单</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            去叫车，开始您的出行吧
          </div>
          <div 
            onClick={() => navigate('/')}
            style={{ 
              marginTop: '24px',
              display: 'inline-block',
              padding: '12px 32px',
              background: '#ff6a00',
              color: 'white',
              borderRadius: '24px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            去叫车
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          {orders.map((order, index) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div 
                key={order.id}
                onClick={() => handleOrderClick(order)}
                style={{ 
                  background: 'white',
                  marginTop: index > 0 ? '10px' : 0,
                  padding: '16px',
                  cursor: ['pending', 'accepted', 'in_progress', 'completed', 'paid'].includes(order.status) ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{order.car_type_icon || '🚗'}</span>
                    <span style={{ fontWeight: '500' }}>{order.car_type_name}</span>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    color: statusInfo.color,
                    fontWeight: '500'
                  }}>
                    {statusInfo.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#07c160' 
                    }}></div>
                    <div style={{ width: '2px', height: '24px', background: '#e0e0e0' }}></div>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '2px', 
                      background: '#ff6a00' 
                    }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px' }}>{order.start_name}</div>
                    <div style={{ height: '12px' }}></div>
                    <div style={{ fontSize: '14px' }}>{order.end_name}</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(order.created_at).toLocaleString('zh-CN')}
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#ff6a00'
                  }}>
                    ¥{order.actual_price?.toFixed(2) || order.estimated_price?.toFixed(2)}
                  </div>
                </div>

                {order.status === 'paid' && (
                  <div style={{ 
                    marginTop: '12px', 
                    textAlign: 'right'
                  }}>
                    <span 
                      style={{ 
                        padding: '6px 16px',
                        background: '#ff6a00',
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      去评价
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;