import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [liveRiders, setLiveRiders] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heatmap');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'heatmap') {
        const [heatRes, ridersRes] = await Promise.all([
          api.get('/platform/heatmap'),
          api.get('/gps/live')
        ]);
        setHeatmapData(heatRes.data?.data || []);
        setLiveRiders(ridersRes.data || []);
      } else {
        const res = await api.get('/platform/demand-prediction');
        setPredictions(res.data?.predictions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity) => {
    if (intensity > 0.8) return 'rgba(255, 77, 79, 0.8)';
    if (intensity > 0.5) return 'rgba(250, 173, 20, 0.7)';
    return 'rgba(82, 196, 26, 0.6)';
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>🔥 运力热力图 & 单量预测</h1>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')}>运力热力图</div>
        <div className={`tab-item ${activeTab === 'prediction' ? 'active' : ''}`} onClick={() => setActiveTab('prediction')}>单量预测</div>
      </div>

      {activeTab === 'heatmap' && (
        <>
          <div className="card">
            <h3 className="card-title">当前在线骑手：{liveRiders.length} 人</h3>
            <div className="heatmap-container">
              {heatmapData.map((p, i) => {
                const x = ((p.longitude - 116.4) / 0.1) * 100;
                const y = ((p.latitude - 39.9) / 0.1) * 100;
                const size = 20 + p.intensity * 40;
                return (
                  <div
                    key={i}
                    className="heatmap-point"
                    style={{
                      left: `${Math.max(5, Math.min(95, x))}%`,
                      top: `${Math.max(5, Math.min(95, y))}%`,
                      width: size,
                      height: size,
                      background: getIntensityColor(p.intensity)
                    }}
                    title={`骑手: ${p.rider_count}人, 订单: ${p.order_count}个, 强度: ${p.intensity.toFixed(2)}`}
                  />
                );
              })}
              {liveRiders.map((r, i) => {
                const x = ((r.longitude - 116.4) / 0.1) * 100;
                const y = ((r.latitude - 39.9) / 0.1) * 100;
                return (
                  <div
                    key={`rider-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${Math.max(5, Math.min(95, x))}%`,
                      top: `${Math.max(5, Math.min(95, y))}%`,
                      width: '12px',
                      height: '12px',
                      background: '#1677ff',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: '2px solid #fff',
                      boxShadow: '0 0 6px rgba(22,119,255,0.8)',
                      zIndex: 10,
                      cursor: 'pointer'
                    }}
                    title={r.real_name}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(82,196,26,0.6)', borderRadius: '50%', marginRight: '6px' }} />低热度区域</div>
              <div><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(250,173,20,0.7)', borderRadius: '50%', marginRight: '6px' }} />中热度区域</div>
              <div><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(255,77,79,0.8)', borderRadius: '50%', marginRight: '6px' }} />高热度区域</div>
              <div><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#1677ff', borderRadius: '50%', marginRight: '6px' }} />在线骑手</div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">在线骑手列表（近5分钟活跃）</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>骑手姓名</th>
                  <th>纬度（脱敏）</th>
                  <th>经度（脱敏）</th>
                  <th>最后上报时间</th>
                </tr>
              </thead>
              <tbody>
                {liveRiders.map((r, i) => (
                  <tr key={i}>
                    <td>{r.real_name}</td>
                    <td>{r.latitude}</td>
                    <td>{r.longitude}</td>
                    <td>{new Date(r.timestamp * 1000).toLocaleString()}</td>
                  </tr>
                ))}
                {liveRiders.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>暂无在线骑手</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'prediction' && (
        <div className="card">
          <h3 className="card-title">今日 24 小时单量预测</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
            {predictions.map((p, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{p.predicted_orders}</div>
                <div
                  style={{
                    width: '100%',
                    background: p.predicted_orders > 40 ? 'linear-gradient(180deg, #ff7875, #ff4d4f)' : p.predicted_orders > 25 ? 'linear-gradient(180deg, #ffc069, #faad14)' : 'linear-gradient(180deg, #95de64, #52c41a)',
                    height: `${Math.min(100, (p.predicted_orders / 80) * 100)}%`,
                    borderRadius: '4px 4px 0 0',
                    minHeight: '8px'
                  }}
                  title={`供需比: ${p.supply_demand_ratio}`}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.hour_of_day}:00</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>高峰时段：11:00-13:00, 17:00-19:00</div>
            <div>供需比 {' > '} 1.5 建议启动激励红包池</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeatmap;
