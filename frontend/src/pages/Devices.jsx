import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devRes, statsRes, alertsRes] = await Promise.all([
        api.getDevices({}),
        api.getDeviceStats(),
        api.getAlerts({ is_resolved: 0 })
      ]);
      setDevices(devRes.data.data);
      setStats(statsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateDeviceStatus(id, status);
      loadData();
    } catch (err) {
      alert('操作失败：' + err.message);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await api.resolveAlert(id);
      loadData();
    } catch (err) {
      alert('操作失败：' + err.message);
    }
  };

  const getDeviceTypeName = (type) => {
    const names = {
      gate: '道闸',
      camera: '摄像头',
      sensor: '传感器',
      lock: '地锁',
      charger: '充电桩'
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <h1>设备管理</h1>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.device_type}>
            <div className="label">{getDeviceTypeName(s.device_type)}</div>
            <div className="value">{s.total}</div>
            <div className="trend">
              <span style={{ color: '#52c41a' }}>在线 {s.online}</span>
              {' / '}
              <span style={{ color: '#ff4d4f' }}>离线 {s.offline + s.fault}</span>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <div className="card-title">设备告警 ({alerts.length})</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>级别</th>
                  <th>类型</th>
                  <th>场站</th>
                  <th>设备</th>
                  <th>消息</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td>
                      <span className={`status-badge ${a.level === 'error' ? 'status-offline' : 'status-pending'}`}>
                        {a.level}
                      </span>
                    </td>
                    <td>{a.alert_type}</td>
                    <td>{a.station_name}</td>
                    <td>{a.device_name || '-'}</td>
                    <td>{a.message}</td>
                    <td>{a.created_at}</td>
                    <td>
                      <button className="btn btn-small btn-success" onClick={() => handleResolveAlert(a.id)}>
                        已处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">设备列表</div>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>设备名称</th>
                  <th>类型</th>
                  <th>所属场站</th>
                  <th>状态</th>
                  <th>最后心跳</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td>{d.device_name}</td>
                    <td>{getDeviceTypeName(d.device_type)}</td>
                    <td>{d.station_name}</td>
                    <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                    <td>{d.last_heartbeat || '-'}</td>
                    <td>
                      {d.status === 'online' && (
                        <button className="btn btn-small btn-warning" onClick={() => handleStatusChange(d.id, 'offline')}>
                          设为离线
                        </button>
                      )}
                      {d.status === 'offline' && (
                        <button className="btn btn-small btn-success" onClick={() => handleStatusChange(d.id, 'online')}>
                          设为在线
                        </button>
                      )}
                      <button className="btn btn-small btn-danger" style={{ marginLeft: '5px' }} onClick={() => handleStatusChange(d.id, 'fault')}>
                        模拟故障
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Devices;