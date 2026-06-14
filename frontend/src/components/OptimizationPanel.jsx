import React, { useState, useEffect } from 'react';
import './OptimizationPanel.css';

const OptimizationPanel = ({
  activeSession,
  onStart,
  onEnd,
  batteryData,
  currentStrategy,
  adjustments,
  selectedModel
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [activeSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedTimeLeft = () => {
    if (!batteryData) return '--';
    const remaining = 100 - batteryData.level;
    const minutes = remaining * 2.5;
    return `${Math.floor(minutes)} 分钟`;
  };

  const safetyCheck = () => {
    if (!batteryData) return { safe: true, message: '系统正常' };
    if (batteryData.temperature > 45) {
      return { safe: false, message: '温度过高，已暂停优化', critical: true };
    }
    if (batteryData.temperature > 40) {
      return { safe: true, message: '温度偏高，已调整策略', warning: true };
    }
    if (batteryData.temperature < 5) {
      return { safe: false, message: '温度过低，已暂停优化', critical: true };
    }
    if (batteryData.health === 'OVERHEAT') {
      return { safe: false, message: '电池过热保护已触发', critical: true };
    }
    return { safe: true, message: '安全状态良好' };
  };

  const safety = safetyCheck();

  const getStrategyDisplay = (strategy, key) => {
    if (!strategy) return { value: '默认', adjusted: false };
    const displayMap = {
      screenTimeout: { unit: '秒', default: 30 },
      wifiScanInterval: { unit: '秒', default: 120 },
      backgroundWakeup: { unit: '', default: false, trueText: '开启', falseText: '关闭' },
      cpuThrottling: { unit: '', default: false, trueText: '启用', falseText: '禁用' },
      syncDisabled: { unit: '', default: false, trueText: '禁用', falseText: '启用' }
    };
    const config = displayMap[key];
    if (!config) return { value: '默认', adjusted: false };
    const value = strategy[key];
    const defaultValue = config.default;
    const displayValue = typeof value === 'boolean'
      ? (value ? config.trueText : config.falseText)
      : `${value}${config.unit}`;
    return {
      value: displayValue,
      adjusted: value !== defaultValue
    };
  };

  const strategyItems = [
    { key: 'screenTimeout', label: '屏幕超时', icon: '🖥️' },
    { key: 'wifiScanInterval', label: 'WiFi扫描间隔', icon: '📶' },
    { key: 'backgroundWakeup', label: '后台唤醒', icon: '🔔' },
    { key: 'cpuThrottling', label: 'CPU降频', icon: '⚡' },
    { key: 'syncDisabled', label: '后台同步', icon: '🔄' }
  ];

  const formatAdjustmentTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card optimization-panel span-2">
      <h2>优化控制</h2>
      <div className="optimization-status">
        <div className={`status-badge ${activeSession ? 'active' : 'inactive'}`}>
          {activeSession ? '优化进行中' : '优化未启动'}
        </div>
        {activeSession && (
          <div className="session-info">
            <div className="info-row">
              <span className="label">已运行</span>
              <span className="value">{formatTime(elapsed)}</span>
            </div>
            <div className="info-row">
              <span className="label">起始电量</span>
              <span className="value">{activeSession.start_level}%</span>
            </div>
            <div className="info-row">
              <span className="label">当前电量</span>
              <span className="value">{batteryData?.level || '--'}%</span>
            </div>
            <div className="info-row">
              <span className="label">预估充满</span>
              <span className="value">{estimatedTimeLeft()}</span>
            </div>
            <div className="info-row">
              <span className="label">适配机型</span>
              <span className="value">{selectedModel}</span>
            </div>
          </div>
        )}
      </div>

      <div className={`safety-alert ${safety.critical ? 'danger' : safety.warning ? 'warning' : 'safe'}`}>
        <div className="safety-icon">{safety.critical ? '⚠️' : safety.warning ? '⚡' : '✓'}</div>
        <div className="safety-message">{safety.message}</div>
      </div>

      <div className="optimization-strategies">
        <div className="section-header">
          <h3>优化策略 {activeSession && <span className="dynamic-badge">动态调整中</span>}</h3>
        </div>
        <div className="strategy-list">
          {strategyItems.map(item => {
            const display = getStrategyDisplay(currentStrategy, item.key);
            return (
              <div key={item.key} className={`strategy-item ${display.adjusted ? 'adjusted' : ''}`}>
                <div className="strategy-icon">{item.icon}</div>
                <div className="strategy-info">
                  <div className="strategy-name">{item.label}</div>
                  <div className="strategy-value">
                    {display.value}
                    {display.adjusted && <span className="adjusted-badge">已调整</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {adjustments && adjustments.length > 0 && (
        <div className="adjustment-logs">
          <h3>策略调整记录</h3>
          <div className="logs-list">
            {adjustments.slice(0, 5).map((log, idx) => (
              <div key={idx} className="log-item">
                <span className="log-time">{formatAdjustmentTime(log.timestamp)}</span>
                <span className="log-reason">{log.adjustment_reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="control-buttons">
        {activeSession ? (
          <button onClick={onEnd} className="btn-danger">停止优化</button>
        ) : (
          <button onClick={onStart} className="btn-success" disabled={!safety.safe}>
            开始优化
          </button>
        )}
      </div>

    </div>
  );
};

export default OptimizationPanel;
