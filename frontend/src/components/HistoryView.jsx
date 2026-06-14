import React from 'react';
import './HistoryView.css';

const HistoryView = ({ sessions, efficiencyTrend }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const getTrendDisplay = (trend) => {
    if (!trend || trend.trend === 'insufficient') {
      return null;
    }
    const displays = {
      improving: { icon: '📈', text: '效率持续提升', color: '#22c55e' },
      declining: { icon: '📉', text: '效率有所下降', color: '#ef4444' },
      stable: { icon: '➡️', text: '效率保持稳定', color: '#60a5fa' }
    };
    return displays[trend.trend] || null;
  };

  const trendDisplay = getTrendDisplay(efficiencyTrend);

  const getEfficiencyColor = (eff) => {
    if (eff >= 90) return '#22c55e';
    if (eff >= 85) return '#60a5fa';
    if (eff >= 80) return '#f59e0b';
    return '#ef4444';
  };

  const getStrategyLabel = (strategy) => {
    const labels = {
      'adaptive': '自适应优化',
      'conservative': '保守模式',
      'aggressive': '强力优化',
      'default': '默认策略'
    };
    return labels[strategy] || strategy;
  };

  return (
    <div className="card history-view span-3">
      <div className="card-header">
        <h2>历史优化记录</h2>
        {trendDisplay && (
          <div className="trend-badge" style={{ borderColor: trendDisplay.color, color: trendDisplay.color }}>
            {trendDisplay.icon} {trendDisplay.text}
            {efficiencyTrend?.trendValue !== undefined && (
              <span className="trend-value">
                ({efficiencyTrend.trendValue > 0 ? '+' : ''}{efficiencyTrend.trendValue.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {efficiencyTrend?.efficiencies && efficiencyTrend.efficiencies.length >= 2 && (
        <div className="trend-analysis">
          <div className="trend-item">
            <span className="trend-label">前期平均</span>
            <span className="trend-value">{efficiencyTrend.avgFirst?.toFixed(1)}%</span>
          </div>
          <div className="trend-arrow">→</div>
          <div className="trend-item">
            <span className="trend-label">近期平均</span>
            <span className="trend-value">{efficiencyTrend.avgSecond?.toFixed(1)}%</span>
          </div>
          <div className="trend-divider">|</div>
          <div className="trend-item">
            <span className="trend-label">总样本数</span>
            <span className="trend-value">{efficiencyTrend.efficiencies.length}次</span>
          </div>
        </div>
      )}

      <div className="history-list">
        {sessions && sessions.length > 0 ? (
          sessions.map((session, index) => (
            <div key={session.id} className="history-item">
              <div className="history-header">
                <div className="header-left">
                  <span className="history-index">#{sessions.length - index}</span>
                  <span className="history-date">{formatDate(session.start_time)}</span>
                </div>
                <span className={`history-status ${session.is_active === 1 ? 'active' : 'completed'}`}>
                  {session.is_active === 1 ? '进行中' : '已完成'}
                </span>
              </div>

              <div className="history-details">
                <div className="detail-item">
                  <span className="detail-label">起始 → 结束</span>
                  <span className="detail-value">
                    <span className="level-badge start">{session.start_level}%</span>
                    <span className="level-arrow">→</span>
                    <span className="level-badge end">{session.end_level ?? '--'}%</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">充电量</span>
                  <span className="detail-value charge">
                    {session.end_level !== null ? `+${session.end_level - session.start_level}%` : '--'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">持续时间</span>
                  <span className="detail-value">{formatDuration(session.total_time)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">优化效率</span>
                  <span
                    className="detail-value efficiency"
                    style={{ color: getEfficiencyColor(session.efficiency) }}
                  >
                    {session.efficiency !== null ? `${session.efficiency.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">使用策略</span>
                  <span className="detail-value strategy">{getStrategyLabel(session.strategy_used)}</span>
                </div>
                {session.avg_temperature !== null && (
                  <div className="detail-item">
                    <span className="detail-label">平均温度</span>
                    <span className="detail-value">{session.avg_temperature?.toFixed(1)}°C</span>
                  </div>
                )}
                {session.max_temperature !== null && (
                  <div className="detail-item">
                    <span className="detail-label">最高温度</span>
                    <span
                      className="detail-value"
                      style={{ color: session.max_temperature > 45 ? '#ef4444' : session.max_temperature > 40 ? '#f59e0b' : 'inherit' }}
                    >
                      {session.max_temperature?.toFixed(1)}°C
                    </span>
                  </div>
                )}
                {session.avg_voltage !== null && (
                  <div className="detail-item">
                    <span className="detail-label">平均电压</span>
                    <span className="detail-value">{session.avg_voltage?.toFixed(2)}V</span>
                  </div>
                )}
                {session.avg_current !== null && (
                  <div className="detail-item">
                    <span className="detail-label">平均电流</span>
                    <span className="detail-value">{session.avg_current?.toFixed(2)}A</span>
                  </div>
                )}
              </div>

              {session.end_time && (
                <div className="history-footer">
                  <span className="end-time">结束时间: {formatDate(session.end_time)}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-history">
            <div className="no-history-icon">📊</div>
            <p>暂无优化记录</p>
            <p className="hint">开始优化后，记录将显示在这里</p>
          </div>
        )}
      </div>

      {sessions && sessions.length > 0 && (
        <div className="history-note">
          <span className="note-icon">📝</span>
          <span>测量基准: 基于实时传感器数据，效率对比基准为同机型无优化场景下的平均充电速率</span>
        </div>
      )}

    </div>
  );
};

export default HistoryView;
