import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getTrainOrderDetail, getHotCities } from '../utils/api';

function TrainOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cityMap, setCityMap] = useState({});

  useEffect(() => {
    getHotCities().then(res => {
      if (res.data.success) {
        const map = {};
        res.data.data.forEach(city => {
          map[city.code] = city.name;
        });
        setCityMap(map);
      }
    });
  }, []);

  useEffect(() => {
    if (orderId) {
      getTrainOrderDetail(orderId)
        .then(res => {
          if (res.data.success) {
            setOrder(res.data.data);
          }
        })
        .catch(err => {
          console.error('获取订单详情失败:', err);
          alert('订单不存在或已过期');
          navigate('/train');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [orderId, navigate]);

  const getCityName = (code) => cityMap[code] || code;

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待支付',
      'confirmed': '已确认',
      'paid': '已支付',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ff9800',
      'confirmed': '#4caf50',
      'paid': '#2196f3',
      'cancelled': '#9e9e9e'
    };
    return colorMap[status] || '#666';
  };

  if (loading) {
    return (
      <div className="home-page">
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px' }}>
            加载中...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Sidebar />
      <main className="main-content">
        <div className="search-container">
          <div style={{ marginBottom: '30px' }}>
            <button 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#1976d2', 
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0
              }}
              onClick={() => navigate('/train')}
            >
              ← 返回火车票搜索
            </button>
          </div>

          {order && (
            <div className="flight-item" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #f0f0f0' }}>
                <h2 style={{ margin: 0, color: '#333' }}>订单详情</h2>
                <span style={{ 
                  padding: '8px 20px', 
                  borderRadius: '20px', 
                  color: '#fff',
                  fontWeight: 600,
                  backgroundColor: getStatusColor(order.status)
                }}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1976d2' }}>
                    {order.train_no}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff6b35' }}>
                    ¥{order.price}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                      {order.start_time}
                    </div>
                    <div style={{ color: '#666' }}>{getCityName(order.from_city)}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{ borderBottom: '2px dashed #ddd', position: 'relative', top: '-10px' }}></div>
                    <span style={{ fontSize: '20px', color: '#1976d2' }}>→</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                      {order.end_time}
                    </div>
                    <div style={{ color: '#666' }}>{getCityName(order.to_city)}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>订单信息</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>订单编号</div>
                    <div style={{ fontWeight: 600 }}>{order.order_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>乘车日期</div>
                    <div style={{ fontWeight: 600 }}>{order.travel_date}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>座位类型</div>
                    <div style={{ fontWeight: 600 }}>{order.seat_type || '二等座'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>下单时间</div>
                    <div style={{ fontWeight: 600 }}>{order.created_at}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                  className="search-btn"
                  style={{ padding: '12px 50px', fontSize: '16px' }}
                  onClick={() => navigate('/train')}
                >
                  继续购票
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainOrderDetail;
