import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('init');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({ init: false, traffic: false, guidance: false, logs: false });

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  async function loadLogs() {
    setLoading(prev => ({ ...prev, logs: true }));
    try {
      const data = await api.getDeviceLogs();
      setLogs(data);
    } catch (e) {
      alert('加载日志失败: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  }

  async function initDemoData() {
    if (!window.confirm('确定初始化演示数据？这将清空现有数据。')) return;
    
    setLoading(prev => ({ ...prev, init: true }));
    try {
      const existingLots = await api.getParkingLots();
      for (const lot of existingLots) {
        try { await api.deleteParkingLot(lot.id); } catch (e) {}
      }

      const demoLots = [
        { name: '国贸中心停车场', address: '北京市朝阳区建国门外大街1号', latitude: 39.9087, longitude: 116.4605, total_spots: 80, charging_spots: 16, price_per_hour: 15, business_hours: '00:00-24:00', device_status: 'online', entrance_points: ['东入口', 'B2直达口'] },
        { name: '万达广场停车场', address: '北京市朝阳区建国路88号', latitude: 39.9120, longitude: 116.4650, total_spots: 65, charging_spots: 10, price_per_hour: 12, business_hours: '08:00-23:00', device_status: 'online', entrance_points: ['南入口', '商场连廊'] },
        { name: 'CBD核心区停车楼', address: '北京市朝阳区光华路10号', latitude: 39.9150, longitude: 116.4550, total_spots: 120, charging_spots: 24, price_per_hour: 18, business_hours: '06:00-24:00', device_status: 'online', entrance_points: ['西入口', '写字楼入口'] },
        { name: '世贸天阶地下停车场', address: '北京市朝阳区光华路9号', latitude: 39.9180, longitude: 116.4580, total_spots: 45, charging_spots: 8, price_per_hour: 10, business_hours: '10:00-22:00', device_status: 'offline', entrance_points: ['北入口'] }
      ];

      for (const lot of demoLots) {
        await api.createParkingLot(lot);
      }

      alert('演示数据初始化完成！共创建 ' + demoLots.length + ' 个停车场。页面将刷新。');
      window.location.reload();
    } catch (e) {
      alert('初始化失败: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, init: false }));
    }
  }

  function generatePlate() {
    const provinces = ['京', '沪', '粤', '津', '冀'];
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const p = provinces[Math.floor(Math.random() * provinces.length)];
    const l = letters[Math.floor(Math.random() * letters.length)];
    const n = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return p + l + n;
  }

  async function simulateTraffic() {
    setLoading(prev => ({ ...prev, traffic: true }));
    try {
      const lots = await api.getParkingLots();
      if (lots.length === 0) { alert('请先初始化停车场数据'); return; }

      const randomLot = lots[Math.floor(Math.random() * lots.length)];
      const plate = generatePlate();
      const spotNum = 'A' + String(Math.floor(Math.random() * 50) + 1).padStart(3, '0');
      
      await api.recordEntry({ plate_number: plate, parking_lot_id: randomLot.id, spot_number: spotNum });
      alert('模拟成功！车辆 ' + plate + ' 已进入 ' + randomLot.name);
    } catch (e) {
      alert('模拟失败: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, traffic: false }));
    }
  }

  async function simulateGuidance() {
    setLoading(prev => ({ ...prev, guidance: true }));
    try {
      const lots = await api.getParkingLots();
      if (lots.length === 0) { alert('请先初始化停车场数据'); return; }

      const randomLot = lots[Math.floor(Math.random() * lots.length)];
      await api.recordGuidanceClick({ parking_lot_id: randomLot.id, user_session: 'sim_' + Date.now() });
      alert('模拟成功！用户点击了 ' + randomLot.name + ' 的导航');
    } catch (e) {
      alert('模拟失败: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, guidance: false }));
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>⚙️ 管理后台</h2>

      <div className="tabs">
        <div className={`tab ${activeTab === 'init' ? 'active' : ''}`} onClick={() => setActiveTab('init')}>数据初始化</div>
        <div className={`tab ${activeTab === 'simulate' ? 'active' : ''}`} onClick={() => setActiveTab('simulate')}>数据模拟</div>
        <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>设备日志</div>
      </div>

      {activeTab === 'init' && (
        <div className="card">
          <h3>数据初始化</h3>
          <p style={{ marginBottom: '1rem', color: '#64748b' }}>初始化4个演示停车场数据，包含完整车位信息、充电位和价格设置</p>
          <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem', color: '#475569' }}>
            <li>国贸中心停车场 - 80车位/16充电位 - ¥15/h</li>
            <li>万达广场停车场 - 65车位/10充电位 - ¥12/h</li>
            <li>CBD核心区停车楼 - 120车位/24充电位 - ¥18/h</li>
            <li>世贸天阶地下停车场 - 45车位/8充电位 - ¥10/h (设备离线)</li>
          </ul>
          <button className="btn btn-primary" onClick={initDemoData} disabled={loading.init}>
            {loading.init ? '初始化中...' : '初始化演示数据'}
          </button>
        </div>
      )}

      {activeTab === 'simulate' && (
        <div className="card">
          <h3>业务数据模拟</h3>
          <p style={{ marginBottom: '1rem', color: '#64748b' }}>模拟真实业务场景数据，用于验证系统功能</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={simulateTraffic} disabled={loading.traffic}>
              {loading.traffic ? '模拟中...' : '🚗 模拟车辆入场'}
            </button>
            <button className="btn btn-primary" onClick={simulateGuidance} disabled={loading.guidance}>
              {loading.guidance ? '模拟中...' : '🧭 模拟诱导点击'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <h3>设备状态日志</h3>
          {loading.logs ? <p>加载中...</p> : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>停车场</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map(log => (
                    <tr key={log.id}>
                      <td>{log.parking_lot_name}</td>
                      <td>
                        <span className={`badge ${log.status === 'online' ? 'badge-success' : 'badge-danger'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.logged_at}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state">
                          <div className="icon">📝</div>
                          <p>暂无设备日志</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
