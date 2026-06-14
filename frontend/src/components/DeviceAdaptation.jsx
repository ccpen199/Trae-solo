import React from 'react';
import './DeviceAdaptation.css';

const DeviceAdaptation = ({ adaptations, selectedModel }) => {
  const currentAdaptation = adaptations?.find(a => a.device_model === selectedModel) || adaptations?.[0];

  const socManufacturers = {
    'Qualcomm': { name: '高通', color: '#ef4444' },
    'Apple': { name: '苹果', color: '#60a5fa' },
    'HiSilicon': { name: '海思', color: '#22c55e' },
    'MediaTek': { name: '联发科', color: '#f59e0b' },
    'Samsung': { name: '三星', color: '#a78bfa' },
    'Generic': { name: '通用', color: '#64748b' }
  };

  const getSocInfo = (manufacturer) => {
    return socManufacturers[manufacturer] || socManufacturers['Generic'];
  };

  const strategyLabels = {
    screenTimeout: '屏幕超时',
    wifiScanInterval: 'WiFi扫描间隔',
    backgroundWakeup: '后台唤醒',
    cpuThrottling: 'CPU降频',
    syncDisabled: '后台同步'
  };

  const formatStrategyValue = (key, value) => {
    if (key === 'screenTimeout' || key === 'wifiScanInterval') {
      return `${value}秒`;
    }
    if (typeof value === 'boolean') {
      return value ? '启用' : '禁用';
    }
    return value;
  };

  return (
    <div className="card device-adaptation span-1">
      <h2>厂商机型适配</h2>

      {currentAdaptation && (
        <div className="adaptation-content">
          <div className="device-header">
            <div className="device-icon">📱</div>
            <div className="device-info">
              <div className="device-name">{currentAdaptation.device_model}</div>
              <div className="soc-info">
                <span
                  className="soc-badge"
                  style={{ backgroundColor: `${getSocInfo(currentAdaptation.soc_manufacturer).color}20`, color: getSocInfo(currentAdaptation.soc_manufacturer).color }}
                >
                  {getSocInfo(currentAdaptation.soc_manufacturer).name} {currentAdaptation.soc_model}
                </span>
              </div>
            </div>
          </div>

          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">最佳电压</span>
              <span className="spec-value">{currentAdaptation.optimal_voltage}V</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">最佳温度</span>
              <span className="spec-value">{currentAdaptation.optimal_temperature}°C</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">最大充电电流</span>
              <span className="spec-value">{currentAdaptation.max_charge_current}A</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">高温阈值</span>
              <span className="spec-value warning">{currentAdaptation.temperature_high_threshold}°C</span>
            </div>
          </div>

          <div className="strategy-section">
            <h3>默认优化策略</h3>
            <div className="strategy-list">
              {Object.entries(currentAdaptation.strategy_config || {}).map(([key, value]) => (
                <div key={key} className="strategy-item">
                  <span className="strategy-label">{strategyLabels[key] || key}</span>
                  <span className={`strategy-value ${value ? 'enabled' : 'disabled'}`}>
                    {formatStrategyValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {adaptations && adaptations.length > 1 && (
            <div className="other-models">
              <h3>支持的其他机型</h3>
              <div className="models-list">
                {adaptations.filter(a => a.id !== currentAdaptation.id).map(a => (
                  <div key={a.id} className="model-item">
                    <span className="model-name">{a.device_model}</span>
                    <span className="model-soc">{getSocInfo(a.soc_manufacturer).name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default DeviceAdaptation;
