import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { TrendData } from '../../../services/api/analytics';
import './TrendCharts.css';

interface TrendChartsProps {
  data: TrendData[];
}

type TrendType = 'visitor' | 'alarm' | 'activity';

const TrendCharts = ({ data }: TrendChartsProps) => {
  const [activeTab, setActiveTab] = useState<TrendType>('visitor');

  const tabs: { key: TrendType; label: string; color: string }[] = [
    { key: 'visitor', label: '客流趋势', color: '#00d4ff' },
    { key: 'alarm', label: '告警趋势', color: '#ff4757' },
    { key: 'activity', label: '场所活跃度', color: '#00ff88' },
  ];

  const getOption = (): EChartsOption => {
    const dates = data.map(d => d.date);

    const getSeriesData = () => {
      switch (activeTab) {
        case 'visitor':
          return data.map(d => d.visitorCount);
        case 'alarm':
          return data.map(d => d.alarmCount);
        case 'activity':
          return data.map(d => d.placeActivity);
        default:
          return [];
      }
    };

    const getColorStops = () => {
      switch (activeTab) {
        case 'visitor':
          return [
            { offset: 0, color: 'rgba(0, 212, 255, 0.5)' },
            { offset: 0.5, color: 'rgba(0, 212, 255, 0.2)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.05)' },
          ];
        case 'alarm':
          return [
            { offset: 0, color: 'rgba(255, 71, 87, 0.5)' },
            { offset: 0.5, color: 'rgba(255, 71, 87, 0.2)' },
            { offset: 1, color: 'rgba(255, 71, 87, 0.05)' },
          ];
        case 'activity':
          return [
            { offset: 0, color: 'rgba(0, 255, 136, 0.5)' },
            { offset: 0.5, color: 'rgba(0, 255, 136, 0.2)' },
            { offset: 1, color: 'rgba(0, 255, 136, 0.05)' },
          ];
        default:
          return [];
      }
    };

    const getLineColor = () => {
      switch (activeTab) {
        case 'visitor':
          return '#00d4ff';
        case 'alarm':
          return '#ff4757';
        case 'activity':
          return '#00ff88';
        default:
          return '#00d4ff';
      }
    };

    const getYAxisName = () => {
      switch (activeTab) {
        case 'visitor':
          return '人次';
        case 'alarm':
          return '条';
        case 'activity':
          return '%';
        default:
          return '';
      }
    };

    const getTooltipFormatter = (params: any) => {
      const param = params[0];
      const value = param.value;
      let formattedValue = value.toLocaleString();
      
      if (activeTab === 'visitor' && value >= 10000) {
        formattedValue = (value / 10000).toFixed(2) + '万';
      } else if (activeTab === 'activity') {
        formattedValue = value + '%';
      }

      const unit = activeTab === 'visitor' ? '人次' : activeTab === 'alarm' ? '条' : '';
      
      return `
        <div style="font-weight: 600; margin-bottom: 8px; color: ${getLineColor()};">
          ${param.name}
        </div>
        <div style="font-size: 14px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${getLineColor()}; margin-right: 8px;"></span>
          ${tabs.find(t => t.key === activeTab)?.label}: <strong>${formattedValue}</strong> ${unit}
        </div>
      `;
    };

    const seriesData = getSeriesData();
    const maxValue = Math.max(...seriesData, 1);
    const yAxisMax = Math.ceil(maxValue * 1.1);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#e0e6ed',
          fontSize: 13
        },
        formatter: getTooltipFormatter,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: getLineColor(),
            width: 1,
            type: 'dashed'
          },
          label: {
            backgroundColor: getLineColor(),
            color: '#fff',
            fontSize: 11,
            padding: [2, 6]
          }
        }
      },
      grid: {
        left: '8%',
        right: '5%',
        bottom: '12%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.3)'
          }
        },
        axisLabel: {
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 11,
          margin: 8
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: getYAxisName(),
        nameTextStyle: {
          color: 'rgba(224, 230, 237, 0.5)',
          fontSize: 11,
          padding: [0, 0, 0, -10]
        },
        max: yAxisMax,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 11,
          formatter: (value: number) => {
            if (activeTab === 'visitor' && value >= 10000) {
              return (value / 10000).toFixed(0) + '万';
            }
            return value.toString();
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.1)',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: tabs.find(t => t.key === activeTab)?.label,
          type: 'line',
          data: seriesData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: getLineColor(),
            width: 3,
            shadowColor: getLineColor(),
            shadowBlur: 10
          },
          itemStyle: {
            color: getLineColor(),
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: getLineColor(),
            shadowBlur: 8
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, getColorStops())
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 15
            },
            scale: true
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut'
        }
      ],
      animation: true,
      animationDurationUpdate: 1000
    };
  };

  const getStats = () => {
    if (data.length === 0) return { total: 0, avg: 0, max: 0, trend: 0 };

    const values = data.map(d => {
      switch (activeTab) {
        case 'visitor': return d.visitorCount;
        case 'alarm': return d.alarmCount;
        case 'activity': return d.placeActivity;
        default: return 0;
      }
    });

    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / values.length);
    const max = Math.max(...values);
    const trend = values.length >= 2 
      ? ((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2] * 100).toFixed(1)
      : '0';

    return { total, avg, max, trend: Number(trend) };
  };

  const stats = getStats();
  const activeColor = tabs.find(t => t.key === activeTab)?.color || '#00d4ff';

  const formatValue = (value: number) => {
    if (activeTab === 'visitor' && value >= 10000) {
      return (value / 10000).toFixed(2) + '万';
    }
    if (activeTab === 'activity') {
      return value + '%';
    }
    return value.toLocaleString();
  };

  return (
    <div className="trend-charts-container">
      <div className="trend-tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`trend-tab ${activeTab === tab.key ? 'active' : ''}`}
            style={{
              '--tab-color': tab.color,
              borderColor: activeTab === tab.key ? tab.color : 'rgba(0, 212, 255, 0.2)',
              color: activeTab === tab.key ? tab.color : 'rgba(224, 230, 237, 0.7)',
            } as React.CSSProperties}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-indicator" />
            {tab.label}
          </div>
        ))}
      </div>

      <div className="trend-stats">
        <div className="trend-stat-item">
          <span className="stat-label">总计</span>
          <span className="stat-value" style={{ color: activeColor }}>
            {formatValue(stats.total)}
          </span>
        </div>
        <div className="trend-stat-item">
          <span className="stat-label">日均</span>
          <span className="stat-value" style={{ color: activeColor }}>
            {formatValue(stats.avg)}
          </span>
        </div>
        <div className="trend-stat-item">
          <span className="stat-label">最高</span>
          <span className="stat-value" style={{ color: activeColor }}>
            {formatValue(stats.max)}
          </span>
        </div>
        <div className="trend-stat-item">
          <span className="stat-label">环比</span>
          <span
            className="stat-value"
            style={{ color: stats.trend >= 0 ? '#00ff88' : '#ff4757' }}
          >
            {stats.trend >= 0 ? '+' : ''}{stats.trend}%
          </span>
        </div>
      </div>

      <div className="trend-chart-wrapper">
        <ReactECharts
          option={getOption()}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
        />
      </div>
    </div>
  );
};

export default TrendCharts;
