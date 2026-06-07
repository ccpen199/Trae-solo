import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminCapacity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/capacity-dashboard');
      setData(res.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  const onlineDrivers = data?.drivers?.filter(d => d.online === 1) || [];
  const pendingOrders = data?.active_orders?.filter(o => o.status === 'pending') || [];

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>城市运力调度看板</h2>

      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: '在线司机', value: onlineDrivers.length, color: '#52c41a', icon: '🚚' },
          { label: '待派单', value: pendingOrders.length, color: '#fa8c16', icon: '📦' },
          { label: '运输中', value: (data?.active_orders?.length || 0) - pendingOrders.length, color: '#1677ff', icon: '🔄' },
          { label: '空驶率', value: '12.5%', color: '#722ed1', icon: '📊' }
        ].map((card, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </div>
                <div style={{ color: '#666', marginTop: '4px' }}>{card.label}</div>
              </div>
              <div style={{ fontSize: '32px' }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>司机位置分布</h3>
          <div style={{ 
            height: '300px', 
            background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
            borderRadius: '8px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: '#1677ff' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗺️</div>
              <div>地图区域 (模拟展示)</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                共 {onlineDrivers.length} 位司机在线
              </div>
            </div>
            {onlineDrivers.slice(0, 6).map((driver, i) => (
              <div 
                key={driver.id}
                style={{
                  position: 'absolute',
                  top: `${20 + (i * 10)}%`,
                  left: `${15 + (i * 12)}%`,
                  background: '#52c41a',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              >
                {driver.name}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>订单密度热力图</h3>
          <div style={{ 
            height: '300px', 
            background: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: '#fa8c16' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</div>
              <div>订单密度热力图 (模拟展示)</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                当前活跃订单: {data?.active_orders?.length || 0} 单
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>在线司机列表</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>司机</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>车型</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>车牌</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>评分</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>完成单</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {onlineDrivers.map(driver => (
                <tr key={driver.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px' }}>{driver.name}</td>
                  <td style={{ padding: '12px' }}>{driver.vehicle_type}</td>
                  <td style={{ padding: '12px' }}>{driver.vehicle_number}</td>
                  <td style={{ padding: '12px' }}>⭐ {driver.service_score}</td>
                  <td style={{ padding: '12px' }}>{driver.order_count}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: '#52c41a' }}>● 在线</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
