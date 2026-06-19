import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface ROIGaugeProps {
  value: number;
  dailyWater?: number;
  unitPrice?: number;
  maintenanceCost?: number;
}

const ROIGauge = ({ value, dailyWater = 120, unitPrice = 5, maintenanceCost = 180 }: ROIGaugeProps) => {
  const dailyRevenue = dailyWater * unitPrice - maintenanceCost;
  const monthlyRevenue = dailyRevenue * 30;
  const yearlyRevenue = dailyRevenue * 365;

  const option = useMemo(
    () => ({
      series: [
        {
          type: 'gauge',
          center: ['50%', '55%'],
          radius: '90%',
          startAngle: 225,
          endAngle: -45,
          min: 0,
          max: 100,
          splitNumber: 10,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#36cfc9' },
                { offset: 0.5, color: '#1890ff' },
                { offset: 1, color: '#722ed1' },
              ],
            },
            shadowColor: 'rgba(24,144,255,0.3)',
            shadowBlur: 10,
          },
          progress: {
            show: true,
            width: 20,
            roundCap: true,
          },
          axisLine: {
            lineStyle: {
              width: 20,
              color: [[1, '#f0f0f0']],
            },
          },
          axisTick: {
            distance: -25,
            length: 6,
            lineStyle: {
              color: '#d9d9d9',
              width: 1,
            },
          },
          splitLine: {
            distance: -30,
            length: 12,
            lineStyle: {
              color: '#bfbfbf',
              width: 2,
            },
          },
          axisLabel: {
            distance: 15,
            color: '#8c8c8c',
            fontSize: 10,
          },
          pointer: {
            show: false,
          },
          anchor: {
            show: false,
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '0%'],
            fontSize: 32,
            fontWeight: 700,
            formatter: '{value}%',
            color: '#1f1f1f',
          },
          data: [{ value }],
        },
      ],
    }),
    [value]
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 280 }}>
        <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          padding: '0 16px 16px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>日均收益</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
            ¥{dailyRevenue.toFixed(0)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>月均收益</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
            ¥{monthlyRevenue.toFixed(0)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>年收益预估</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#722ed1' }}>
            ¥{yearlyRevenue.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIGauge;
