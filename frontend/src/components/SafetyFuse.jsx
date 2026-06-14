import React from 'react';
import './SafetyFuse.css';

const SafetyFuse = ({ fuseRecords, onResolve }) => {
  const getTriggerReasonLabel = (reason) => {
    const labels = {
      'TEMPERATURE_OVER_HIGH': { text: '温度过高', icon: '🔥', color: '#ef4444' },
      'TEMPERATURE_TOO_LOW': { text: '温度过低', icon: '❄️', color: '#60a5fa' },
      'VOLTAGE_OVER_HIGH': { text: '电压过高', icon: '⚡', color: '#f59e0b' },
      'VOLTAGE_TOO_LOW': { text: '电压过低', icon: '🔋', color: '#f59e0b' },
      'BATTERY_HEALTH_OVERHEAT': { text: '电池过热保护', icon: '🌡️', color: '#ef4444' },
      'BATTERY_HEALTH_OVER_VOLTAGE': { text: '电池过压保护', icon: '⚠️', color: '#f59e0b' },
      'BATTERY_HEALTH_DEAD': { text: '电池故障', icon: '❌', color: '#ef4444' }
    };
    return labels[reason] || { text: reason, icon: '⚠️', color: '#f59e0b' };
  };

  const getActionLabel = (action) => {
    const labels = {
      'PAUSE_CHARGING_OPTIMIZATION': '暂停优化',
      'REDUCE_CHARGING_CURRENT': '降低电流',
      'INCREASE_CHARGING_CURRENT': '提高电流',
      'STOP_CHARGING_COMPLETELY': '停止充电'
    };
    return labels[action] || action;
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

  const activeRecords = fuseRecords?.filter(r => r.resolved === 0) || [];
  const historyRecords = fuseRecords?.filter(r => r.resolved === 1) || [];
  const totalRecords = fuseRecords?.length || 0;

  const getStats = () => {
    const stats = {
      tempHigh: 0,
      tempLow: 0,
      voltage: 0,
      health: 0
    };
    fuseRecords?.forEach(r => {
      if (r.trigger_reason?.includes('TEMPERATURE') && r.trigger_reason?.includes('HIGH')) stats.tempHigh++;
      if (r.trigger_reason?.includes('TEMPERATURE') && r.trigger_reason?.includes('LOW')) stats.tempLow++;
      if (r.trigger_reason?.includes('VOLTAGE')) stats.voltage++;
      if (r.trigger_reason?.includes('HEALTH')) stats.health++;
    });
    return stats;
  };

  const stats = getStats();

  return (
    <div className="card safety-fuse span-2">
      <div className="card-header">
        <h2>安全熔断记录</h2>
        <div className="fuse-stats">
          <span className={`stat-badge ${activeRecords.length > 0 ? 'active' : ''}`}>
            {activeRecords.length} 条待处理
          </span>
          <span className="stat-badge total">
            共 {totalRecords} 条
          </span>
        </div>
      </div>

      {totalRecords > 0 && (
        <div className="stats-overview">
          <div className="stat-item">
            <span className="stat-icon" style={{ color: '#ef4444' }}>🔥</span>
            <span className="stat-count">{stats.tempHigh}</span>
            <span className="stat-label">高温触发</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" style={{ color: '#60a5fa' }}>❄️</span>
            <span className="stat-count">{stats.tempLow}</span>
            <span className="stat-label">低温触发</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" style={{ color: '#f59e0b' }}>⚡</span>
            <span className="stat-count">{stats.voltage}</span>
            <span className="stat-label">电压异常</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" style={{ color: '#a78bfa' }}>❤️</span>
            <span className="stat-count">{stats.health}</span>
            <span className="stat-label">健康异常</span>
          </div>
        </div>
      )}

      {activeRecords.length > 0 && (
        <div className="records-section">
          <h3>⚠️ 待处理熔断 ({activeRecords.length})</h3>
          <div className="records-list">
            {activeRecords.map(record => {
              const reasonInfo = getTriggerReasonLabel(record.trigger_reason);
              return (
                <div key={record.id} className="record-item active">
                  <div className="record-icon" style={{ backgroundColor: `${reasonInfo.color}20`, color: reasonInfo.color }}>
                    {reasonInfo.icon}
                  </div>
                  <div className="record-content">
                    <div className="record-header">
                      <span className="record-reason" style={{ color: reasonInfo.color }}>
                        {reasonInfo.text}
                      </span>
                      <span className="record-time">{formatTime(record.trigger_time)}</span>
                    </div>
                    <div className="record-details">
                      <span className="detail-item">
                        触发值: {record.trigger_value?.toFixed(1) || '--'}
                        {record.trigger_reason?.includes('TEMPERATURE') ? '°C' : record.trigger_reason?.includes('VOLTAGE') ? 'V' : ''}
                      </span>
                      <span className="detail-item">
                        阈值: {record.threshold?.toFixed(1) || '--'}
                        {record.trigger_reason?.includes('TEMPERATURE') ? '°C' : record.trigger_reason?.includes('VOLTAGE') ? 'V' : ''}
                      </span>
                      <span className="detail-item action">
                        处理: {getActionLabel(record.action_taken)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onResolve(record.id)}
                    className="resolve-btn"
                  >
                    标记已处理
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historyRecords.length > 0 && (
        <div className="records-section">
          <h3>📋 历史熔断记录</h3>
          <div className="records-list compact">
            {historyRecords.slice(0, 5).map(record => {
              const reasonInfo = getTriggerReasonLabel(record.trigger_reason);
              return (
                <div key={record.id} className="record-item resolved">
                  <div className="record-icon small" style={{ backgroundColor: `${reasonInfo.color}15`, color: reasonInfo.color }}>
                    {reasonInfo.icon}
                  </div>
                  <div className="record-content">
                    <div className="record-header">
                      <span className="record-reason" style={{ color: reasonInfo.color, opacity: 0.8 }}>
                        {reasonInfo.text}
                      </span>
                      <span className="record-time">{formatTime(record.trigger_time)}</span>
                    </div>
                    <div className="record-details">
                      <span className="detail-item">
                        {record.trigger_value?.toFixed(1) || '--'} → 阈值 {record.threshold?.toFixed(1) || '--'}
                      </span>
                      <span className="detail-item resolved-badge">
                        ✓ 已处理 {formatTime(record.resolved_time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalRecords === 0 && (
        <div className="no-records">
          <div className="no-records-icon">✓</div>
          <p>暂无安全熔断记录</p>
          <p className="hint">当温度/电压超出阈值时将自动触发安全保护</p>
        </div>
      )}

      <div className="fuse-note">
        <span className="note-icon">🛡️</span>
        <span>安全熔断机制基于实时传感器数据，超过阈值时自动暂停优化或降低充电功率，保护电池安全</span>
      </div>

    </div>
  );
};

export default SafetyFuse;
