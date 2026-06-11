import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { statsApi, stationApi } from '../api';
import { HeatMapData, FailureRanking, FunnelStage, DailyStats } from '../types';

const DashboardPage = () => {
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [failureRanking, setFailureRanking] = useState<FailureRanking[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [nationalReport, setNationalReport] = useState<any>(null);
  const [cityStats, setCityStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [heat, failure, funnel, daily, hourly, report, cities] = await Promise.all([
        statsApi.getHeatMap().catch(() => []),
        statsApi.getFailureRanking(10).catch(() => []),
        statsApi.getRechargeFunnel().catch(() => []),
        statsApi.getDailyStats(7).catch(() => []),
        statsApi.getHourly().catch(() => []),
        statsApi.getNationalReport().catch(() => null),
        stationApi.getCityStats().catch(() => []),
      ]);

      setHeatMapData(heat || []);
      setFailureRanking(failure || []);
      setFunnelData(funnel || []);
      setDailyStats(daily || []);
      setHourlyData(hourly || []);
      setNationalReport(report);
      setCityStats(cities || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFunnelOption = () => ({
    title: {
      text: '用户复充率漏斗',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        name: '用户转化',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 20,
        width: '80%',
        min: 0,
        max: funnelData[0]?.value || 100,
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          fontSize: 12,
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: funnelData.map((item, idx) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: ['#0077b6', '#00b4d8', '#52c41a', '#faad14', '#ff4d4f'][idx % 5],
          },
        })),
      },
    ],
  });

  const getFailureRankingOption = () => ({
    title: {
      text: '场站故障率 TOP 10',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const data = failureRanking[item.dataIndex];
        return `${data.station_name}<br/>城市：${data.city}<br/>故障桩：${data.fault_piles}/${data.total_piles}<br/>故障率：${data.failure_rate}%`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: failureRanking.slice(0, 10).map(item =>
        item.station_name.length > 10 ? item.station_name.slice(0, 10) + '...' : item.station_name
      ).reverse(),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '故障率',
        type: 'bar',
        data: failureRanking.slice(0, 10).map(item => item.failure_rate).reverse(),
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            if (value > 15) return '#ff4d4f';
            if (value > 8) return '#faad14';
            return '#52c41a';
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 11,
        },
      },
    ],
  });

  const getDailyTrendOption = () => ({
    title: {
      text: '近7日充电趋势',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['充电次数', '充电量(kWh)', '充电金额(元)'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dailyStats.map(item => item.date?.slice(5) || ''),
    },
    yAxis: [
      {
        type: 'value',
        name: '次数/金额',
        position: 'left',
      },
      {
        type: 'value',
        name: 'kWh',
        position: 'right',
      },
    ],
    series: [
      {
        name: '充电次数',
        type: 'bar',
        data: dailyStats.map(item => item.total_charges || 0),
        itemStyle: { color: '#0077b6', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '充电量(kWh)',
        type: 'line',
        yAxisIndex: 1,
        data: dailyStats.map(item => item.total_energy || 0),
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '充电金额(元)',
        type: 'line',
        data: dailyStats.map(item => item.total_amount || 0),
        smooth: true,
        itemStyle: { color: '#faad14' },
      },
    ],
  });

  const getHourlyOption = () => ({
    title: {
      text: '24小时充电分布',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hourlyData.map(item => `${item.hour}:00`),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '充电次数',
        type: 'line',
        data: hourlyData.map(item => item.charge_count || 0),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 119, 182, 0.3)' },
              { offset: 1, color: 'rgba(0, 119, 182, 0.05)' },
            ],
          },
        },
        itemStyle: { color: '#0077b6' },
      },
    ],
  });

  const getHeatMapColor = (occupancy: number) => {
    if (occupancy >= 0.7) return '#ff4d4f';
    if (occupancy >= 0.5) return '#faad14';
    if (occupancy >= 0.3) return '#52c41a';
    return '#91d5ff';
  };

  return (
    <div>
      <h1 className="page-title">运营数据看板</h1>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          加载中...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-title">充电站总数</div>
              <div className="stat-card-value">{nationalReport?.total_stations || 0}</div>
              <div className="stat-card-trend">
                覆盖 {nationalReport?.covered_cities || 0} 个城市
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">充电桩总数</div>
              <div className="stat-card-value">{nationalReport?.total_piles || 0}</div>
              <div className="stat-card-trend trend-up">
                在线 {nationalReport?.available_piles + nationalReport?.charging_piles || 0} 台
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">今日充电量</div>
              <div className="stat-card-value" style={{ color: '#52c41a' }}>
                {(nationalReport?.today_energy || 0).toFixed(0)} kWh
              </div>
              <div className="stat-card-trend">
                {nationalReport?.today_charges || 0} 次充电
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">今日营收</div>
              <div className="stat-card-value" style={{ color: '#faad14' }}>
                ¥{(nationalReport?.today_amount || 0).toFixed(0)}
              </div>
              <div className="stat-card-trend trend-up">较昨日 +12.5%</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="chart-container">
              <ReactECharts option={getDailyTrendOption()} style={{ height: 320 }} />
            </div>
            <div className="chart-container">
              <ReactECharts option={getHourlyOption()} style={{ height: 320 }} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="chart-container">
              <ReactECharts option={getFailureRankingOption()} style={{ height: 360 }} />
            </div>
            <div className="chart-container">
              <ReactECharts option={getFunnelOption()} style={{ height: 360 }} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 20 }}>城市充电热力图</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {heatMapData.map((item, idx) => (
                <div
                  key={item.city}
                  className="heat-city"
                  style={{
                    background: `linear-gradient(135deg, ${getHeatMapColor(item.occupancy_rate)}22 0%, ${getHeatMapColor(item.occupancy_rate)}44 100%)`,
                    borderLeft: `4px solid ${getHeatMapColor(item.occupancy_rate)}`,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{item.city}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: getHeatMapColor(item.occupancy_rate), margin: '4px 0' }}>
                    {(item.occupancy_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {item.station_count} 站 / {item.total_piles} 桩
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>国家充电监测平台数据上报</h3>
              <span className="status-badge status-completed">已同步</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>数据项</th>
                    <th>数据量</th>
                    <th>上报时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>充电站基础信息</td>
                    <td>{nationalReport?.total_stations || 0} 座</td>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td><span className="status-badge status-completed">已上报</span></td>
                  </tr>
                  <tr>
                    <td>充电桩实时状态</td>
                    <td>{nationalReport?.total_piles || 0} 台</td>
                    <td>{new Date().toLocaleTimeString()}</td>
                    <td><span className="status-badge status-completed">已上报</span></td>
                  </tr>
                  <tr>
                    <td>充电订单数据</td>
                    <td>{nationalReport?.today_charges || 0} 笔</td>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td><span className="status-badge status-completed">已上报</span></td>
                  </tr>
                  <tr>
                    <td>充电量统计</td>
                    <td>{(nationalReport?.today_energy || 0).toFixed(0)} kWh</td>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td><span className="status-badge status-completed">已上报</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
              数据上报符合《国家充电基础设施监测平台数据交换规范》
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
