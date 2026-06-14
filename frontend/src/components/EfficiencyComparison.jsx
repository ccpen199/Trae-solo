import React, { useMemo } from 'react';
import './EfficiencyComparison.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EfficiencyComparison = ({ efficiencyData, efficiencyTrend }) => {
  const chartData = useMemo(() => {
    if (!efficiencyData?.sessions) return null;
    const sessions = efficiencyData.sessions;
    const labels = sessions.map((_, idx) => `第${idx + 1}次`);
    const efficiencies = sessions.map(s => s.efficiency);
    const avgLine = new Array(sessions.length).fill(efficiencyData.statistics?.average_efficiency || 0);

    return {
      labels,
      datasets: [
        {
          label: '优化效率 (%)',
          data: efficiencies,
          backgroundColor: efficiencies.map(e =>
            e > 88 ? 'rgba(34, 197, 94, 0.7)' :
            e > 80 ? 'rgba(96, 165, 250, 0.7)' :
            'rgba(245, 158, 11, 0.7)'
          ),
          borderColor: efficiencies.map(e =>
            e > 88 ? '#22c55e' :
            e > 80 ? '#60a5fa' :
            '#f59e0b'
          ),
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: `平均效率 (${(efficiencyData.statistics?.average_efficiency || 0).toFixed(1)}%)`,
          data: avgLine,
          borderColor: '#a78bfa',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          type: 'line',
          yAxisID: 'y'
        }
      ]
    };
  }, [efficiencyData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterLabel: function(context) {
            const session = efficiencyData?.sessions?.[context.dataIndex];
            if (session) {
              return [
                `起始电量: ${session.start_level}%`,
                `结束电量: ${session.end_level}%`,
                `充电量: ${session.end_level - session.start_level}%`,
                `持续时间: ${Math.floor(session.total_time / 60)}分${session.total_time % 60}秒`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(71, 85, 105, 0.2)'
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 }
        }
      },
      y: {
        min: 60,
        max: 100,
        grid: {
          color: 'rgba(71, 85, 105, 0.2)'
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (value) => value + '%'
        },
        title: {
          display: true,
          text: '优化效率 (%)',
          color: '#a78bfa',
          font: { size: 11, weight: 'bold' }
        }
      }
    }
  };

  const getTrendDisplay = (trend) => {
    if (!trend || trend.trend === 'insufficient') {
      return { icon: '📊', text: '数据不足', color: '#94a3b8', desc: '需要至少2次有效充电记录' };
    }
    const displays = {
      improving: { icon: '📈', text: '持续提升', color: '#22c55e', desc: `效率提升 ${trend.trendValue.toFixed(1)}%` },
      declining: { icon: '📉', text: '有所下降', color: '#ef4444', desc: `效率下降 ${Math.abs(trend.trendValue).toFixed(1)}%` },
      stable: { icon: '➡️', text: '保持稳定', color: '#60a5fa', desc: `效率波动在 ${Math.abs(trend.trendValue).toFixed(1)}% 以内` }
    };
    return displays[trend.trend] || displays.stable;
  };

  const trendDisplay = getTrendDisplay(efficiencyTrend);

  return (
    <div className="card efficiency-comparison span-1">
      <h2>效率对比分析</h2>

      {efficiencyData?.statistics && (
        <div className="stats-overview">
          <div className="trend-card" style={{ borderColor: trendDisplay.color }}>
            <div className="trend-icon">{trendDisplay.icon}</div>
            <div className="trend-info">
              <div className="trend-text" style={{ color: trendDisplay.color }}>{trendDisplay.text}</div>
              <div className="trend-desc">{trendDisplay.desc}</div>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">总次数</span>
              <span className="stat-value">{efficiencyData.statistics.total_sessions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均效率</span>
              <span className="stat-value highlight">{efficiencyData.statistics.average_efficiency.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最佳效率</span>
              <span className="stat-value best">{efficiencyData.statistics.best_efficiency.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="chart-container">
        {chartData ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="no-data">
            <p>暂无效率对比数据</p>
            <p className="hint">完成至少2次优化后可查看对比</p>
          </div>
        )}
      </div>

      {efficiencyData?.sessions && efficiencyData.sessions.length > 0 && (
        <div className="efficiency-note">
          <span className="note-icon">📝</span>
          <span>优化效率基于充电速率与功耗控制综合计算，基准为同机型无优化场景</span>
        </div>
      )}

    </div>
  );
};

export default EfficiencyComparison;
