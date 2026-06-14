import React, { useState } from 'react';
import './BatteryMonitor.css';

const BatteryMonitor = ({ batteryData, onRecord, selectedModel }) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [formData, setFormData] = useState({
    voltage: 4.2,
    current: 1.5,
    temperature: 28,
    level: 65,
    health: 'GOOD',
    status: 'CHARGING',
    plugged: 'USB',
    power_source: 'BatteryManager',
    usb_protocol: 'USB_PD',
    is_charging: true,
    measurement_baseline: 'Android BatteryManager API, 1Hz采样, USB供电协议探测',
    sampling_rate: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecord(formData);
  };

  const getTemperatureColor = (temp) => {
    if (temp < 20) return '#60a5fa';
    if (temp < 35) return '#22c55e';
    if (temp < 45) return '#f59e0b';
    return '#ef4444';
  };

  const getTemperatureStatus = (temp) => {
    if (temp < 20) return { text: '偏冷', icon: '❄️' };
    if (temp < 35) return { text: '正常', icon: '✓' };
    if (temp < 45) return { text: '偏高', icon: '⚠️' };
    return { text: '过热', icon: '🔥' };
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSeconds = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}小时${remainMins}分钟`;
    }
    return `${mins}分${secs}秒`;
  };

  const tempStatus = batteryData ? getTemperatureStatus(batteryData.temperature) : null;

  return (
    <div className="card battery-monitor span-2">
      <div className="card-header">
        <h2>实时电池监控</h2>
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="toggle-btn"
        >
          {showSimulator ? '隐藏模拟录入' : '显示模拟录入'}
        </button>
      </div>

      {batteryData ? (
        <div className="monitor-content">
          <div className="battery-main">
            <div className="battery-visual">
              <div className={`level-circle ${batteryData.is_charging ? 'charging' : ''}`}>
                <span className="level-number">{batteryData.level}%</span>
                {batteryData.is_charging && <span className="charging-indicator">⚡</span>}
              </div>
              <div className="level-label">
                {batteryData.is_charging ? '充电中' : '未充电'}
              </div>
              {batteryData.estimated_full_time_seconds && batteryData.is_charging && (
                <div className="estimated-time">
                  预计充满：{formatSeconds(batteryData.estimated_full_time_seconds)}
                </div>
              )}
            </div>

            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <span className="metric-label">电压</span>
                  <span className="metric-value">{batteryData.voltage?.toFixed(2) || '--'} V</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">💧</div>
                <div className="metric-content">
                  <span className="metric-label">电流</span>
                  <span className="metric-value">{batteryData.current?.toFixed(2) || '--'} A</span>
                </div>
              </div>
              <div className="metric-item temp-item">
                <div className="metric-icon" style={{ color: getTemperatureColor(batteryData.temperature) }}>
                  {tempStatus?.icon}
                </div>
                <div className="metric-content">
                  <span className="metric-label">温度 {tempStatus?.text}</span>
                  <span
                    className="metric-value"
                    style={{ color: getTemperatureColor(batteryData.temperature) }}
                  >
                    {batteryData.temperature?.toFixed(1) || '--'}°C
                  </span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">❤️</div>
                <div className="metric-content">
                  <span className="metric-label">健康度</span>
                  <span className="metric-value">{batteryData.health || '--'}</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">🔌</div>
                <div className="metric-content">
                  <span className="metric-label">供电来源</span>
                  <span className="metric-value">{batteryData.power_source || batteryData.plugged || '--'}</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">📡</div>
                <div className="metric-content">
                  <span className="metric-label">USB协议</span>
                  <span className="metric-value">{batteryData.usb_protocol || '--'}</span>
                </div>
              </div>
              <div className="metric-item full">
                <div className="metric-icon">⏱️</div>
                <div className="metric-content">
                  <span className="metric-label">采样时间</span>
                  <span className="metric-value">{formatTime(batteryData.timestamp)}</span>
                </div>
              </div>
              <div className="metric-item full">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <span className="metric-label">测量基准</span>
                  <span className="metric-value baseline">{batteryData.measurement_baseline || 'Android BatteryManager API, 1Hz采样, USB供电协议探测'}</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">📱</div>
                <div className="metric-content">
                  <span className="metric-label">适配机型</span>
                  <span className="metric-value">{batteryData.device_model || selectedModel}</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">🔋</div>
                <div className="metric-content">
                  <span className="metric-label">采样频率</span>
                  <span className="metric-value">{batteryData.sampling_rate || 1}Hz</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>暂无监控数据</p>
          <p className="hint">请点击下方"显示模拟录入"添加测试数据</p>
        </div>
      )}

      {showSimulator && (
        <form onSubmit={handleSubmit} className="record-form">
          <h3>模拟数据录入</h3>
          <div className="form-grid">
            <div className="form-item">
              <label>电压 (V)</label>
              <input
                type="number"
                step="0.01"
                value={formData.voltage}
                onChange={(e) => setFormData({ ...formData, voltage: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-item">
              <label>电流 (A)</label>
              <input
                type="number"
                step="0.01"
                value={formData.current}
                onChange={(e) => setFormData({ ...formData, current: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-item">
              <label>温度 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-item">
              <label>电量 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-item">
              <label>健康度</label>
              <select
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value })}
              >
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="GOOD">GOOD</option>
                <option value="OVERHEAT">OVERHEAT</option>
                <option value="DEAD">DEAD</option>
                <option value="OVER_VOLTAGE">OVER_VOLTAGE</option>
                <option value="UNSPECIFIED_FAILURE">UNSPECIFIED_FAILURE</option>
                <option value="COLD">COLD</option>
              </select>
            </div>
            <div className="form-item">
              <label>充电状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="CHARGING">CHARGING</option>
                <option value="DISCHARGING">DISCHARGING</option>
                <option value="NOT_CHARGING">NOT_CHARGING</option>
                <option value="FULL">FULL</option>
              </select>
            </div>
            <div className="form-item">
              <label>供电来源</label>
              <select
                value={formData.power_source}
                onChange={(e) => setFormData({ ...formData, power_source: e.target.value })}
              >
                <option value="BatteryManager">BatteryManager API</option>
                <option value="USB_PD">USB PD</option>
                <option value="QC3.0">QC 3.0</option>
                <option value="VOOC">VOOC</option>
                <option value="Wireless">无线充电</option>
                <option value="AC">AC适配器</option>
              </select>
            </div>
            <div className="form-item">
              <label>USB协议</label>
              <select
                value={formData.usb_protocol}
                onChange={(e) => setFormData({ ...formData, usb_protocol: e.target.value })}
              >
                <option value="USB_PD">USB PD</option>
                <option value="QC2.0">QC 2.0</option>
                <option value="QC3.0">QC 3.0</option>
                <option value="QC4.0">QC 4.0</option>
                <option value="VOOC">VOOC</option>
                <option value="DASH">DASH</option>
                <option value="WARP">WARP</option>
              </select>
            </div>
            <div className="form-item">
              <label>充电中</label>
              <select
                value={formData.is_charging ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_charging: e.target.value === 'true' })}
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
            <div className="form-item">
              <label>采样频率</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.sampling_rate}
                onChange={(e) => setFormData({ ...formData, sampling_rate: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">记录数据</button>
        </form>
      )}

    </div>
  );
};

export default BatteryMonitor;
