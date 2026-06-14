import React, { useMemo } from 'react';
import './ChargingChart.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChargingChart = ({ history, batteryData, selectedModel, adaptations }) => {
  const getThresholds = () => {
    const adaptation = adaptations?.find(a => a.device_model === selectedModel);
    return {
      tempHigh: adaptation?.temperature_high_threshold || 45,
      tempLow: adaptation?.temperature_low_threshold || 5,
      optimalTemp: adaptation?.optimal_temperature || 25,
      optimalVoltage: adaptation?.optimal_voltage || 4.2
    };
  };

  const thresholds = getThresholds();

  const formatSeconds = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}小时${remainMins}分钟`;
    }
    return `${mins}分钟`;
  };

  const chartData = useMemo(() => {
    const labels = history.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });

    const tempHighLine = new Array(history.length).fill(thresholds.tempHigh);
    const optimalTempLine = new Array(history.length).fill(thresholds.optimalTemp);

    return {
      labels,
      datasets: [
        {
          label: '电量 (%)',
          data: history.map(item => item.level),
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#1e293b',
          pointBorderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: '温度 (°C)',
          data: history.map(item => item.temperature),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#1e293b',
          pointBorderWidth: 2,
          yAxisID: 'y1'
        },
        {
          label: `高温阈值 (${thresholds.tempHigh}°C)`,
          data: tempHighLine,
          borderColor: '#ef4444',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          yAxisID: 'y1'
        },
        {
          label: `最佳温度 (${thresholds.optimalTemp}°C)`,
          data: optimalTempLine,
          borderColor: '#22c55e',
          borderWidth: 1,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
          yAxisID: 'y1'
        }
      ]
    };
  }, [history, thresholds]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
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
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const dataPoint = history[context.dataIndex];
            let extra = '';
            if (label.includes('电量') && dataPoint) {
              extra = ` | ${dataPoint.is_charging ? '充电中' : '未充电'}`;
            }
            if (label.includes('温度') && dataPoint) {
              const status = value > thresholds.tempHigh ? ' ⚠️ 超阈值' :
                           value > 40 ? ' ⚡ 偏高' :
                           value < thresholds.tempLow ? ' ❄️ 偏低' : ' ✓ 正常';
              extra = status;
            }
            return `${label}: ${value.toFixed(1)}${extra}`;
          },
          afterLabel: function(context) {
            const dataPoint = history[context.dataIndex];
            if (dataPoint && context.dataset.label?.includes('电量')) {
              return [
                `电压: ${dataPoint.voltage?.toFixed(2) || '--'}V`,
                `电流: ${dataPoint.current?.toFixed(2) || '--'}A`,
                `健康度: ${dataPoint.health || '--'}`
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
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
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
          text: '电量 (%)',
          color: '#60a5fa',
          font: { size: 11, weight: 'bold' }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: -10,
        max: 60,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#f59e0b',
          font: { size: 10 },
          callback: (value) => value + '°'
        },
        title: {
          display: true,
          text: '温度 (°C)',
          color: '#f59e0b',
          font: { size: 11, weight: 'bold' }
        }
      }
    }
  };

  const chargingStats = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    const levelChange = last.level - first.level;
    const timeDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / 1000 / 60;
    const avgVoltage = history.reduce((a, b) => a + b.voltage, 0) / history.length;
    const avgCurrent = history.reduce((a, b) => a + b.current, 0) / history.length;
    const maxTemp = Math.max(...history.map(h => h.temperature));
    const overThresholdCount = history.filter(h => h.temperature > thresholds.tempHigh).length;

    return {
      levelChange,
      timeDiff: Math.round(timeDiff),
      avgVoltage,
      avgCurrent,
      maxTemp,
      overThresholdCount
    };
  }, [history, thresholds]);

  return (
    <div className="card charging-chart span-3">
      <div className="card-header">
        <h2>充电曲线分析</h2>
        {batteryData?.estimated_full_time_seconds && batteryData?.is_charging && (
          <div className="estimated-badge">
            预计充满: <strong>{formatSeconds(batteryData.estimated_full_time_seconds)}</strong>
          </div>
        )}
      </div>

      {chargingStats && (
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">电量变化</span>
            <span className={`stat-value ${chargingStats.levelChange > 0 ? 'positive' : chargingStats.levelChange < 0 ? 'negative' : ''}`}>
              {chargingStats.levelChange > 0 ? '+' : ''}{chargingStats.levelChange}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">统计时长</span>
            <span className="stat-value">{chargingStats.timeDiff}分钟</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">平均电压</span>
            <span className="stat-value">{chargingStats.avgVoltage.toFixed(2)}V</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">平均电流</span>
            <span className="stat-value">{chargingStats.avgCurrent.toFixed(2)}A</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">最高温度</span>
            <span className={`stat-value ${chargingStats.maxTemp > thresholds.tempHigh ? 'danger' : chargingStats.maxTemp > 40 ? 'warning' : ''}`}>
              {chargingStats.maxTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">超温次数</span>
            <span className={`stat-value ${chargingStats.overThresholdCount > 0 ? 'danger' : ''}`}>
              {chargingStats.overThresholdCount}次
            </span>
          </div>
        </div>
      )}

      <div className="chart-container">
        {history.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="no-data">
            <p>暂无充电曲线数据</p>
            <p className="hint">请先记录电池数据以生成充电曲线</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="data-points-note">
          <span className="note-icon">💡</span>
          <span>共 {history.length} 个数据点，点击数据点可查看详细参数</span>
          <span className="baseline-note">
            测量基准: {batteryData?.measurement_baseline || 'Android BatteryManager API, 1Hz采样'}
          </span>
        </div>
      )}

    </div>
  );
};

export default ChargingChart;
