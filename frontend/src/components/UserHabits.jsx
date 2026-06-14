import React from 'react';
import './UserHabits.css';

const UserHabits = ({ habits, onAnalyze }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}小时${remainMins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getPeriodLabel = (period) => {
    const labels = {
      morning: '上午 (6-12点)',
      afternoon: '下午 (12-18点)',
      evening: '晚间 (18-24点)',
      night: '夜间 (0-6点)'
    };
    return labels[period] || period;
  };

  const getHighRiskHours = (lowBatteryHours) => {
    if (!lowBatteryHours) return [];
    const entries = Object.entries(lowBatteryHours);
    if (entries.length === 0) return [];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  };

  const getTopPeriods = (chargingPatterns) => {
    if (!chargingPatterns) return [];
    return Object.entries(chargingPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
  };

  const highRiskHours = getHighRiskHours(habits?.low_battery_hours);
  const topPeriods = getTopPeriods(habits?.charging_patterns);

  const getLearningLevel = (score) => {
    if (!score || score < 30) return { level: '初级', color: '#64748b', desc: '需要更多数据学习' };
    if (score < 60) return { level: '中级', color: '#60a5fa', desc: '已掌握基本习惯' };
    if (score < 85) return { level: '高级', color: '#a78bfa', desc: '习惯模型较准确' };
    return { level: '专家', color: '#22c55e', desc: '深度个性化适配' };
  };

  const learningLevel = getLearningLevel(habits?.learning_score);

  return (
    <div className="card user-habits span-1">
      <div className="card-header">
        <h2>用户习惯学习</h2>
        <button onClick={onAnalyze} className="analyze-btn">
          重新分析
        </button>
      </div>

      {habits ? (
        <div className="habits-content">
          <div className="learning-score-card" style={{ borderColor: learningLevel.color }}>
            <div className="score-circle" style={{ borderColor: learningLevel.color }}>
              <span className="score-value" style={{ color: learningLevel.color }}>
                {Math.round(habits.learning_score || 0)}
              </span>
              <span className="score-label">学习分</span>
            </div>
            <div className="score-info">
              <div className="score-level" style={{ color: learningLevel.color }}>
                {learningLevel.level}
              </div>
              <div className="score-desc">{learningLevel.desc}</div>
            </div>
          </div>

          {highRiskHours.length > 0 && (
            <div className="habit-section">
              <h3>⚠️ 低电量高发时段</h3>
              <div className="risk-list">
                {highRiskHours.map((item, idx) => (
                  <div key={idx} className="risk-item">
                    <span className="risk-time">{item.hour}:00 - {item.hour + 1}:00</span>
                    <span className="risk-count">{item.count}次</span>
                  </div>
                ))}
              </div>
              <p className="habit-tip">建议在以上时段提前充电或开启省电模式</p>
            </div>
          )}

          {topPeriods.length > 0 && (
            <div className="habit-section">
              <h3>🔋 常用充电时段</h3>
              <div className="period-list">
                {topPeriods.map(([period, count], idx) => (
                  <div key={idx} className="period-item">
                    <span className="period-name">{getPeriodLabel(period)}</span>
                    <span className="period-count">{count}次记录</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">日均充电</span>
              <span className="stat-value">{habits.avg_daily_charge_count || '--'}次</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均时长</span>
              <span className="stat-value">{formatDuration(habits.avg_charge_duration)}</span>
            </div>
          </div>

          {habits.common_charge_levels && habits.common_charge_levels.length > 0 && (
            <div className="habit-section">
              <h3>📊 常见充电起始电量</h3>
              <div className="level-tags">
                {[...new Set(habits.common_charge_levels)]
                  .slice(0, 5)
                  .filter(l => l < 100)
                  .sort((a, b) => a - b)
                  .map((level, idx) => (
                    <span key={idx} className="level-tag">
                      {level}%
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="update-note">
            <span>上次更新: {habits.last_updated ? new Date(habits.last_updated).toLocaleString('zh-CN') : '未知'}</span>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>暂无习惯数据</p>
          <button onClick={onAnalyze} className="analyze-btn-large">
            开始学习用户习惯
          </button>
          <p className="hint">需要至少3次优化记录以进行习惯分析</p>
        </div>
      )}

    </div>
  );
};

export default UserHabits;
