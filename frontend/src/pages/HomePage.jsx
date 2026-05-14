import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationApi, orderApi, messageApi } from '../api';
import { useLocationStore, useOrderStore, useAuthStore } from '../store';
import DestinationSelector from '../components/DestinationSelector';

const serviceTypes = [
  { id: 'express', name: '快车', icon: '🚗', desc: '经济实惠' },
  { id: 'hitchhike', name: '顺风车', icon: '🚌', desc: '绿色环保' },
  { id: 'taxi', name: '出租车', icon: '🚕', desc: '正规出租' },
  { id: 'premium', name: '专车', icon: '🚙', desc: '舒适品质' },
];

const subServices = [
  { id: 'now', name: '现在' },
  { id: 'book', name: '预约' },
  { id: '代叫', name: '代叫' },
  { id: '接送机', name: '接送机' },
  { id: '优惠', name: '优惠' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { currentCity, currentLocation, startPoint, endPoint, setCurrentCity, setStartPoint, setEndPoint } = useLocationStore();
  const { setSelectedCarType } = useOrderStore();
  const { user, isLoggedIn } = useAuthStore();
  
  const [selectedService, setSelectedService] = useState('express');
  const [selectedSubService, setSelectedSubService] = useState('now');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDestSelector, setShowDestSelector] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initPage();
    if (isLoggedIn) {
      checkUnreadMessages();
    }
  }, []);

  const initPage = async () => {
    try {
      const [cityRes, locationRes] = await Promise.all([
        locationApi.getDefaultCity(),
        locationApi.getCurrentLocation()
      ]);
      
      if (cityRes.data.success) {
        setCurrentCity(cityRes.data.data);
      }
      
      if (locationRes.data.success) {
        const loc = locationRes.data.data;
        const start = {
          name: '当前位置',
          address: loc.location.address,
          latitude: loc.location.latitude,
          longitude: loc.location.longitude
        };
        setStartPoint(start);
      }
    } catch (err) {
      console.error('加载失败', err);
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

  const handleStartInput = () => {
    const defaultStart = {
      name: '我的位置',
      address: '北京市朝阳区望京SOHO',
      latitude: 39.9092,
      longitude: 116.4124
    };
    setStartPoint(defaultStart);
  };

  const handleEndInput = () => {
    setShowDestSelector(true);
  };

  const handleSelectDestination = (dest) => {
    setEndPoint(dest);
  };

  const handleGoToCarType = async () => {
    if (!isLoggedIn) {
      alert('请先登录后再叫车');
      navigate('/login');
      return;
    }
    if (!startPoint) {
      alert('请选择起点');
      return;
    }
    if (!endPoint) {
      alert('请选择终点');
      return;
    }

    try {
      const res = await orderApi.getCarTypes();
      if (res.data.success && res.data.data.length > 0) {
        setSelectedCarType(res.data.data[0]);
        navigate('/car-type');
      }
    } catch (err) {
      alert('加载车型失败，请重试');
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', position: 'relative' }}>
      {showSidebar && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 1000,
            display: 'flex'
          }}
          onClick={() => setShowSidebar(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              width: '70%', 
              height: '100%', 
              padding: '24px 16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #ff6a00, #ff8a33)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                👤
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>{user?.nickname || '用户'}</div>
                <div style={{ color: '#999', fontSize: '12px' }}>{user?.phone || ''}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', background: '#fff8f5', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>💰</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>钱包</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>🎫</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>优惠券</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>⭐</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>积分</div>
              </div>
            </div>

            {[
              { icon: '📋', label: '我的订单', action: () => { navigate('/orders'); setShowSidebar(false); } },
              { icon: '💬', label: '我的消息', action: () => { navigate('/messages'); setShowSidebar(false); } },
              { icon: '🎁', label: '优惠福利', action: () => { navigate('/announcement'); setShowSidebar(false); } },
              { icon: '⚙️', label: '设置', action: () => { navigate('/profile'); setShowSidebar(false); } },
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={item.action}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        background: 'linear-gradient(135deg, #ff6a00 0%, #ff8a33 100%)', 
        padding: '16px', 
        paddingTop: '50px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div 
            onClick={() => setShowSidebar(true)}
            style={{ cursor: 'pointer', fontSize: '24px' }}
          >
            ☰
          </div>
          <div 
            onClick={() => navigate('/city-selector')}
            style={{ display: 'flex', alignItems: 'center', color: 'white', cursor: 'pointer' }}
          >
            <span style={{ marginRight: '4px' }}>📍</span>
            <span style={{ fontSize: '14px' }}>{currentCity?.name || '北京市'}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div 
              onClick={() => navigate('/messages')}
              style={{ position: 'relative', cursor: 'pointer', fontSize: '20px' }}
            >
              🔔
              {unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </div>
            <div style={{ cursor: 'pointer', fontSize: '20px' }}>📷</div>
          </div>
        </div>
      </div>

      <div style={{ height: '180px', background: '#e8f4ff', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '40px'
        }}>
          🗺️
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: '12px', 
          left: '16px', 
          color: '#666',
          fontSize: '12px'
        }}>
          实时路况
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {serviceTypes.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              style={{ 
                padding: '12px 16px', 
                borderRadius: '12px', 
                background: selectedService === service.id ? '#fff5ee' : 'white',
                border: selectedService === service.id ? '1px solid #ff6a00' : '1px solid transparent',
                minWidth: '80px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{service.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '500' }}>{service.name}</div>
              <div style={{ fontSize: '10px', color: '#999' }}>{service.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {subServices.map((sub) => (
            <span
              key={sub.id}
              onClick={() => setSelectedSubService(sub.id)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '16px', 
                fontSize: '12px',
                background: selectedSubService === sub.id ? '#ff6a00' : '#f0f0f0',
                color: selectedSubService === sub.id ? 'white' : '#666',
                cursor: 'pointer'
              }}
            >
              {sub.name}
            </span>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: '#07c160', 
              marginRight: '12px' 
            }}></div>
            <div 
              onClick={handleStartInput}
              style={{ flex: 1, cursor: 'pointer' }}
            >
              <div style={{ fontSize: '14px', color: '#999' }}>出发</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
                {startPoint?.name || '请输入起点'}
              </div>
              {startPoint?.address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {startPoint.address}
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            height: '1px', 
            background: '#f0f0f0', 
            marginLeft: '22px', 
            marginBottom: '16px'
          }}></div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px', 
              background: '#ff6a00', 
              marginRight: '12px' 
            }}></div>
            <div 
              onClick={handleEndInput}
              style={{ flex: 1, cursor: 'pointer' }}
            >
              <div style={{ fontSize: '14px', color: '#999' }}>目的地</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px', color: endPoint ? '#333' : '#999' }}>
                {endPoint?.name || '你要去哪儿？'}
              </div>
              {endPoint?.address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {endPoint.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {startPoint && endPoint && (
          <div style={{ 
            background: '#fff5ee', 
            borderRadius: '12px', 
            padding: '12px 16px', 
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚗</span>
              <span style={{ color: '#ff6a00', fontWeight: '500' }}>已为您规划最优路线</span>
            </div>
          </div>
        )}

        <button
          onClick={handleGoToCarType}
          disabled={!startPoint || !endPoint}
          style={{ 
            width: '100%', 
            padding: '16px', 
            background: (!startPoint || !endPoint) ? '#ccc' : '#ff6a00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '28px', 
            fontSize: '16px',
            fontWeight: '600',
            cursor: (!startPoint || !endPoint) ? 'not-allowed' : 'pointer',
            marginTop: '24px'
          }}
        >
          {startPoint && endPoint ? '确认呼叫' : '请选择起点和终点'}
        </button>
      </div>

      {showDestSelector && (
        <DestinationSelector
          onSelect={handleSelectDestination}
          onClose={() => setShowDestSelector(false)}
        />
      )}
    </div>
  );
};

export default HomePage;