import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { useLocationStore, useOrderStore } from '../store';

const CarTypeSelector = () => {
  const navigate = useNavigate();
  const { startPoint, endPoint } = useLocationStore();
  const { selectedCarType, setSelectedCarType, setRouteInfo, setCurrentOrder } = useOrderStore();
  
  const [carTypes, setCarTypes] = useState([]);
  const [routeInfo, setLocalRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    if (!startPoint || !endPoint) {
      alert('请先选择起点和终点');
      navigate('/');
      return;
    }
    loadData();
  }, [startPoint, endPoint]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [carRes, routeRes] = await Promise.all([
        orderApi.getCarTypes(),
        orderApi.calculateRoute({
          startLat: startPoint.latitude,
          startLng: startPoint.longitude,
          endLat: endPoint.latitude,
          endLng: endPoint.longitude
        })
      ]);

      if (carRes.data.success) {
        setCarTypes(carRes.data.data);
        if (carRes.data.data.length > 0 && !selectedCarType) {
          setSelectedCarType(carRes.data.data[0]);
        }
      }

      if (routeRes.data.success) {
        setLocalRouteInfo(routeRes.data.data);
        setRouteInfo(routeRes.data.data);
        
        if (selectedCarType) {
          const priceInfo = routeRes.data.data.prices.find(
            p => p.car_type_id === selectedCarType.id
          );
          setSelectedPrice(priceInfo);
        }
      }
    } catch (err) {
      console.error('加载失败', err);
      alert('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCar = (carType) => {
    setSelectedCarType(carType);
    if (routeInfo) {
      const priceInfo = routeInfo.prices.find(p => p.car_type_id === carType.id);
      setSelectedPrice(priceInfo);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedCarType) {
      alert('请选择车型');
      return;
    }

    try {
      setSubmitting(true);
      
      const res = await orderApi.createOrder({
        carTypeId: selectedCarType.id,
        startName: startPoint.name,
        startAddress: startPoint.address || '',
        startLat: startPoint.latitude,
        startLng: startPoint.longitude,
        endName: endPoint.name,
        endAddress: endPoint.address || '',
        endLat: endPoint.latitude,
        endLng: endPoint.longitude,
        serviceType: 'express'
      });

      if (res.data.success) {
        setCurrentOrder(res.data.data);
        alert('订单创建成功！正在为您派单...');
        navigate(`/waiting/${res.data.data.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || '下单失败，请重试');
    } finally {
      setSubmitting(false);
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={() => navigate(-1)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: '600' }}>选择车型</div>
          </div>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '16px', marginBottom: '10px' }}>
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
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{startPoint?.name}</div>
              {startPoint?.address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {startPoint.address}
                </div>
              )}
            </div>
            <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: '#999' }}>到达</div>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{endPoint?.name}</div>
              {endPoint?.address && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {endPoint.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {routeInfo && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            marginTop: '16px', 
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#ff6a00' }}>
                {routeInfo.distance_km.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>公里</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#ff6a00' }}>
                约{routeInfo.duration_min}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>分钟</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#ff6a00' }}>
                {selectedPrice?.estimated_price.toFixed(2) || '-'}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>预计价格(元)</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>选择车型</div>
        
        {carTypes.map((carType, index) => {
          const priceInfo = routeInfo?.prices.find(p => p.car_type_id === carType.id);
          const isSelected = selectedCarType?.id === carType.id;
          
          return (
            <div
              key={carType.id}
              onClick={() => handleSelectCar(carType)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px 0',
                borderBottom: index < carTypes.length - 1 ? '1px solid #f0f0f0' : 'none',
                background: isSelected ? '#fff5ee' : 'transparent',
                margin: '0 -16px',
                paddingLeft: '16px',
                paddingRight: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '12px',
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {carType.icon}
              </div>
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{carType.display_name}</span>
                  {index === 0 && (
                    <span style={{ 
                      fontSize: '10px', 
                      background: '#ff6a00', 
                      color: 'white', 
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>推荐</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {carType.description}
                </div>
                {priceInfo && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    起步价 ¥{carType.base_price} · 每公里 ¥{carType.per_km_price}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>
                  ¥{priceInfo?.estimated_price.toFixed(2) || '-'}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>预计</div>
              </div>
              <div style={{ marginLeft: '12px' }}>
                {isSelected ? (
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
            </div>
          );
        })}
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
            <div style={{ fontSize: '12px', color: '#999' }}>
              {selectedCarType?.display_name || '请选择车型'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ff6a00' }}>
              ¥{selectedPrice?.estimated_price.toFixed(2) || '0.00'}
            </div>
          </div>
          <button
            onClick={handleConfirmOrder}
            disabled={submitting || !selectedCarType}
            style={{ 
              padding: '14px 32px', 
              background: (submitting || !selectedCarType) ? '#ccc' : '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: (submitting || !selectedCarType) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '下单中...' : '确认呼叫'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarTypeSelector;