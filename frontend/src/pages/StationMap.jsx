import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DEVICE_TYPE_MAP = { gate: '道闸', camera: '摄像头', sensor: '传感器', lock: '地锁', charger: '充电桩' };
const DEVICE_ICONS = { gate: '🚧', camera: '📷', sensor: '📡', lock: '🔒', charger: '⚡' };
const GUN_STATUS_MAP = { idle: '空闲', charging: '充电中', offline: '离线', fault: '故障' };
const SPOT_STATUS_MAP = { available: '空闲', occupied: '已占用', reserved: '已预约', offline: '离线' };

function StationMap() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const res = await api.getStations();
      setStations(res.data.data);
      if (res.data.data.length > 0) {
        selectStation(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectStation = async (stationId) => {
    setSelectedStation(stationId);
    setSelectedSpot(null);
    try {
      const res = await api.getStationMap(stationId);
      setMapData(res.data.data);
    } catch (err) {
      console.error('Failed to load station map:', err);
    }
  };

  const getSpotClass = (spot) => {
    let classes = ['parking-spot'];
    if (spot.has_charging) classes.push('has-gun');
    if (spot.status === 'available') classes.push('available');
    else if (spot.status === 'occupied') classes.push('occupied');
    else if (spot.status === 'reserved') classes.push('reserved');
    if (spot.gun_status === 'charging') classes.push('charging');
    return classes.join(' ');
  };

  if (loading) return <div className="loading">加载中...</div>;

  const ns = mapData?.normalSpots || { total: 0, available: 0, occupied: 0, reserved: 0, avg_price: 0 };
  const cs = mapData?.chargingSpots || { total: 0, available: 0, occupied: 0, reserved: 0, avg_parking_price: 0 };
  const gps = mapData?.gunPriceStats || { min_price: 0, max_price: 0, avg_price: 0 };
  const gbs = mapData?.gunsByStatus || [];
  const alerts = mapData?.alerts || [];
  const deviceStats = mapData?.deviceStats || [];
  const unresolvedAlerts = alerts.filter(a => a.is_resolved === 0);

  const gunsByIdle = gbs.find(g => g.status === 'idle')?.count || 0;
  const gunsByCharging = gbs.find(g => g.status === 'charging')?.count || 0;
  const gunsByOffline = gbs.find(g => g.status === 'offline')?.count || 0;
  const gunsByFault = gbs.find(g => g.status === 'fault')?.count || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>场站地图</h1>
          <div className="subtitle">普通车位/充电车位、充电枪状态、价格、空闲数、设备告警全览</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">选择场站</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {stations.map(s => (
            <button
              key={s.id}
              className={`btn ${selectedStation === s.id ? 'btn-primary' : ''}`}
              onClick={() => selectStation(s.id)}
            >
              {s.name}
              <span className="badge badge-success" style={{ marginLeft: '8px' }}>
                {s.spotStats?.available || 0}/{s.spotStats?.total || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {mapData && (
        <>
          <div className="card">
            <div className="card-title">📍 场站信息 - {mapData.station?.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <strong>地址：</strong>{mapData.station?.address || '-'}
              </div>
              <div>
                <strong>运营状态：</strong>
                <span className={`status-badge ${mapData.station?.status === 'active' ? 'status-available' : 'status-offline'}`}>
                  {mapData.station?.status === 'active' ? '运营中' : mapData.station?.status}
                </span>
              </div>
              <div>
                <strong>总车位：</strong>{ns.total + cs.total} 个
              </div>
              <div>
                <strong>充电枪：</strong>{gunsByIdle + gunsByCharging + gunsByOffline + gunsByFault} 把
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title">🅿️ 普通车位明细</div>
              <div className="stats-grid" style={{ marginBottom: '12px' }}>
                <div className="stat-card">
                  <div className="label">总车位</div>
                  <div className="value">{ns.total}</div>
                </div>
                <div className="stat-card success">
                  <div className="label">空闲</div>
                  <div className="value">{ns.available}</div>
                  <div className="trend">
                    {ns.total > 0 ? (((ns.available / ns.total) * 100).toFixed(1) + '%') : '0%'}
                  </div>
                </div>
                <div className="stat-card danger">
                  <div className="label">已占用</div>
                  <div className="value">{ns.occupied}</div>
                </div>
                <div className="stat-card warning">
                  <div className="label">已预约</div>
                  <div className="value">{ns.reserved || 0}</div>
                </div>
              </div>
              <div className="order-section">
                <div className="payment-row">
                  <span>计费单价</span>
                  <span style={{ fontWeight: '600', color: '#1890ff' }}>¥{(ns.avg_price || 5).toFixed(0)}/小时</span>
                </div>
                <div className="payment-row">
                  <span>空闲率</span>
                  <span>{ns.total > 0 ? (((ns.available / ns.total) * 100).toFixed(1) + '%') : '0%'}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">⚡ 充电车位明细</div>
              <div className="stats-grid" style={{ marginBottom: '12px' }}>
                <div className="stat-card">
                  <div className="label">总车位</div>
                  <div className="value">{cs.total}</div>
                </div>
                <div className="stat-card success">
                  <div className="label">空闲</div>
                  <div className="value">{cs.available}</div>
                  <div className="trend">
                    {cs.total > 0 ? (((cs.available / cs.total) * 100).toFixed(1) + '%') : '0%'}
                  </div>
                </div>
                <div className="stat-card danger">
                  <div className="label">已占用</div>
                  <div className="value">{cs.occupied}</div>
                </div>
                <div className="stat-card warning">
                  <div className="label">已预约</div>
                  <div className="value">{cs.reserved || 0}</div>
                </div>
              </div>
              <div className="order-section">
                <div className="payment-row">
                  <span>停车单价</span>
                  <span style={{ fontWeight: '600', color: '#1890ff' }}>¥{(cs.avg_parking_price || 8).toFixed(0)}/小时</span>
                </div>
                <div className="payment-row">
                  <span>充电电价</span>
                  <span style={{ fontWeight: '600', color: '#52c41a' }}>¥{gps.min_price?.toFixed(1) || '1.0'} - ¥{gps.max_price?.toFixed(1) || '1.8'}/度</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title">🔫 充电枪状态明细</div>
              <div className="stats-grid" style={{ marginBottom: '12px' }}>
                <div className="stat-card success">
                  <div className="label">空闲</div>
                  <div className="value">{gunsByIdle}</div>
                  <div className="trend">可立即使用</div>
                </div>
                <div className="stat-card primary">
                  <div className="label">充电中</div>
                  <div className="value">{gunsByCharging}</div>
                  <div className="trend">正在服务</div>
                </div>
                <div className="stat-card danger">
                  <div className="label">离线</div>
                  <div className="value">{gunsByOffline}</div>
                  <div className="trend">需检查</div>
                </div>
                <div className="stat-card warning">
                  <div className="label">故障</div>
                  <div className="value">{gunsByFault}</div>
                  <div className="trend">待维修</div>
                </div>
              </div>
              <div className="gun-grid" style={{ marginTop: '16px' }}>
                {gbs.map(g => (
                  <div key={g.status} className="gun-card" style={{ borderColor: g.status === 'idle' ? '#52c41a' : g.status === 'charging' ? '#1890ff' : '#ff4d4f' }}>
                    <div className="gun-status" style={{ background: g.status === 'idle' ? '#f6ffed' : g.status === 'charging' ? '#e6f7ff' : '#fff1f0' }}>
                      {GUN_STATUS_MAP[g.status]}
                    </div>
                    <div className="gun-count">{g.count} 把</div>
                    {g.min_price && (
                      <div className="gun-price">¥{g.min_price.toFixed(1)} - ¥{g.max_price.toFixed(1)}/度</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">🔧 设备状态看板</div>
              <div className="stats-grid">
                {deviceStats.map(d => (
                  <div key={d.device_type} className="stat-card">
                    <div className="label">
                      {DEVICE_ICONS[d.device_type] || '📦'} {DEVICE_TYPE_MAP[d.device_type] || d.device_type}
                    </div>
                    <div className="value">{d.total}</div>
                    <div className="trend">
                      <span style={{ color: '#52c41a' }}>在线 {d.online}</span>
                      {' / '}
                      <span style={{ color: '#ff4d4f' }}>异常 {d.offline + d.fault}</span>
                    </div>
                  </div>
                ))}
              </div>
              {deviceStats.length > 0 && (
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>设备类型</th>
                        <th>总数</th>
                        <th>在线</th>
                        <th>离线</th>
                        <th>故障</th>
                        <th>在线率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceStats.map(d => (
                        <tr key={d.device_type}>
                          <td>
                            {DEVICE_ICONS[d.device_type]} {DEVICE_TYPE_MAP[d.device_type]}
                          </td>
                          <td>{d.total}</td>
                          <td style={{ color: '#52c41a', fontWeight: '500' }}>{d.online}</td>
                          <td style={{ color: '#faad14' }}>{d.offline}</td>
                          <td style={{ color: '#ff4d4f' }}>{d.fault}</td>
                          <td>
                            <span className={`status-badge ${d.online === d.total ? 'status-available' : d.online > d.total / 2 ? 'status-warning' : 'status-offline'}`}>
                              {d.total > 0 ? (((d.online / d.total) * 100).toFixed(1) + '%') : '0%'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ marginBottom: 0 }}>
                ⚠️ 设备告警清单
                {unresolvedAlerts.length > 0 && (
                  <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                    {unresolvedAlerts.length} 条未处理
                  </span>
                )}
              </div>
              <button className="btn btn-small btn-default" onClick={() => navigate('/devices')}>查看全部</button>
            </div>
            {alerts.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>
                <div className="title">暂无告警</div>
                <div className="desc">所有设备运行正常</div>
              </div>
            ) : (
              <div className="alerts-panel">
                {alerts.map(a => (
                  <div key={a.id} className={`alert-item ${a.is_resolved === 0 && (a.alert_level === 'critical' || a.level === 'critical') ? 'error' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className={`badge ${a.is_resolved === 0 ? 'badge-warning' : 'badge-success'}`}>
                          {a.is_resolved === 0 ? '未处理' : '已处理'}
                        </span>
                        <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
                          {DEVICE_ICONS[a.device_type] || '📦'} {DEVICE_TYPE_MAP[a.device_type] || a.device_type}
                        </span>
                        <strong style={{ marginLeft: '8px' }}>{a.device_name || '-'}</strong>
                        <span style={{ marginLeft: '12px', color: '#666' }}>{a.message}</span>
                      </div>
                      <div className="time">{a.created_at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">实时状态统计</div>
            <div className="map-stats">
              <div className="map-stat">
                <div className="num">{mapData.stats.available_spots}</div>
                <div className="label">空闲车位</div>
              </div>
              <div className="map-stat">
                <div className="num" style={{ color: '#ff4d4f' }}>{mapData.stats.occupied_spots}</div>
                <div className="label">已占用</div>
              </div>
              <div className="map-stat">
                <div className="num" style={{ color: '#52c41a' }}>{mapData.stats.idle_guns}</div>
                <div className="label">空闲充电枪</div>
              </div>
              <div className="map-stat">
                <div className="num" style={{ color: '#1890ff' }}>{mapData.stats.charging_guns}</div>
                <div className="label">充电中</div>
              </div>
              <div className="map-stat">
                <div className="num" style={{ color: '#ff4d4f' }}>{mapData.stats.offline_guns}</div>
                <div className="label">离线枪</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">图例说明</div>
            <div className="spot-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#52c41a' }}></div>
                <span>空闲车位</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#ff4d4f' }}></div>
                <span>已占用</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#faad14' }}></div>
                <span>已预约</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#1890ff' }}></div>
                <span>充电中</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ border: '3px solid #722ed1', width: '10px', height: '10px' }}></div>
                <span>带充电枪</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">车位布局图</div>
            <div className="parking-map">
              {mapData.spots.map(spot => (
                <div
                  key={spot.id}
                  className={getSpotClass(spot)}
                  onClick={() => setSelectedSpot(spot)}
                  title={`${spot.spot_number} - ${SPOT_STATUS_MAP[spot.status] || spot.status}`}
                >
                  <div>{spot.spot_number}</div>
                  {spot.has_charging && <div className="charging-icon">⚡</div>}
                </div>
              ))}
            </div>
          </div>

          {selectedSpot && (
            <div className="card">
              <div className="card-title">车位详情 - {selectedSpot.spot_number}</div>
              <div className="form-row">
                <div>
                  <strong>车位类型：</strong>
                  <span className={`badge ${selectedSpot.type === 'charging' ? 'badge-success' : 'badge-primary'}`}>
                    {selectedSpot.type === 'charging' ? '充电车位' : '普通车位'}
                  </span>
                </div>
                <div>
                  <strong>当前状态：</strong>
                  <span className={`status-badge status-${selectedSpot.status}`}>
                    {SPOT_STATUS_MAP[selectedSpot.status] || selectedSpot.status}
                  </span>
                </div>
                <div>
                  <strong>停车单价：</strong>¥{selectedSpot.price_per_hour}/小时
                </div>
                {selectedSpot.has_charging && (
                  <>
                    <div>
                      <strong>充电枪：</strong>{selectedSpot.gun_number}
                    </div>
                    <div>
                      <strong>枪状态：</strong>
                      <span className={`status-badge status-${selectedSpot.gun_status}`}>
                        {GUN_STATUS_MAP[selectedSpot.gun_status] || selectedSpot.gun_status}
                      </span>
                    </div>
                    <div>
                      <strong>充电单价：</strong>¥{selectedSpot.price_per_kwh}/度
                    </div>
                    <div>
                      <strong>充电功率：</strong>{selectedSpot.power}kW
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StationMap;
