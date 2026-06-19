import { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Spin, App as AntdApp } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  CloudServerOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import StatsCard from '../components/StatsCard';
import ROIGauge from '../components/ROIGauge';
import type { DashboardStats } from '../services/investorApi';

const mockData: DashboardStats = {
  totalInvestment: 2580000,
  totalRevenue: 856200,
  deviceCount: 486,
  onlineRate: 94.2,
  dailyWaterConsumption: 58560,
  unitPrice: 5,
  maintenanceCost: 87600,
  roi: 33.2,
  paybackPeriod: 36,
  paybackProgress: 62.5,
  monthlyRevenue: [
    { month: '1月', revenue: 42000 },
    { month: '2月', revenue: 38500 },
    { month: '3月', revenue: 55200 },
    { month: '4月', revenue: 61800 },
    { month: '5月', revenue: 72500 },
    { month: '6月', revenue: 85600 },
    { month: '7月', revenue: 92300 },
    { month: '8月', revenue: 88900 },
    { month: '9月', revenue: 76400 },
    { month: '10月', revenue: 68200 },
    { month: '11月', revenue: 71500 },
    { month: '12月', revenue: 83300 },
  ],
};

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardStats>(mockData);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setData(mockData);
      } catch {
        message.error('获取仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [message]);

  const revenueChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#f0f0f0',
      textStyle: { color: '#333' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/>收益: ¥${p.value.toLocaleString()}`;
      },
    },
    grid: {
      left: 48,
      right: 24,
      top: 24,
      bottom: 32,
    },
    xAxis: {
      type: 'category',
      data: data.monthlyRevenue.map((m) => m.month),
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#8c8c8c', fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#8c8c8c',
        fontSize: 12,
        formatter: (val: number) => `${(val / 1000).toFixed(0)}k`,
      },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#36cfc9' },
              { offset: 1, color: '#1890ff' },
            ],
          },
          shadowColor: 'rgba(24,144,255,0.3)',
          shadowBlur: 8,
        },
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.3)' },
              { offset: 1, color: 'rgba(24,144,255,0.02)' },
            ],
          },
        },
        data: data.monthlyRevenue.map((m) => m.revenue),
        animationDuration: 1500,
      },
    ],
  };

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard
              title="总投资额"
              value={(data.totalInvestment / 10000).toFixed(1)}
              prefix="¥"
              suffix="万"
              icon={<DollarOutlined />}
              trend={5.2}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard
              title="累计收益"
              value={(data.totalRevenue / 10000).toFixed(1)}
              prefix="¥"
              suffix="万"
              icon={<RiseOutlined />}
              trend={12.8}
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard
              title="设备总数"
              value={data.deviceCount}
              suffix="台"
              icon={<CloudServerOutlined />}
              trend={3.5}
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard
              title="设备在线率"
              value={data.onlineRate}
              suffix="%"
              icon={<WifiOutlined />}
              trend={1.2}
              color="#faad14"
            />
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span className="card-title">ROI投资回报率</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
              bodyStyle={{ padding: 0 }}
            >
              <ROIGauge
                value={data.roi}
                dailyWater={data.dailyWaterConsumption}
                unitPrice={data.unitPrice}
                maintenanceCost={data.maintenanceCost / 365}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={[24, 24]} style={{ height: '100%' }}>
              <Col span={24}>
                <Card
                  title={<span className="card-title">投资回收周期</span>}
                  bordered={false}
                  style={{ borderRadius: 12 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>预计回收期</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: '#1f1f1f' }}>
                        {data.paybackPeriod}
                        <span style={{ fontSize: 14, color: '#8c8c8c', marginLeft: 4 }}>个月</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>当前进度</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                        {data.paybackProgress}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>%</span>
                      </div>
                    </div>
                  </div>
                  <Progress
                    percent={data.paybackProgress}
                    strokeColor={{
                      '0%': '#36cfc9',
                      '100%': '#1890ff',
                    }}
                    trailColor="#f0f0f0"
                    size={[0, 12]}
                  />
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(114,46,209,0.08))',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                      预计回收时间
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1f1f1f' }}>
                      2026年12月（剩余 14 个月）
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  title={<span className="card-title">日均收益构成</span>}
                  bordered={false}
                  style={{ borderRadius: 12 }}
                >
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item',
                        formatter: '{b}: ¥{c} ({d}%)',
                      },
                      legend: {
                        orient: 'vertical',
                        right: 0,
                        top: 'center',
                        itemWidth: 12,
                        itemHeight: 12,
                        textStyle: { fontSize: 12, color: '#595959' },
                      },
                      series: [
                        {
                          type: 'pie',
                          radius: ['50%', '72%'],
                          center: ['30%', '50%'],
                          avoidLabelOverlap: false,
                          itemStyle: {
                            borderRadius: 6,
                            borderColor: '#fff',
                            borderWidth: 2,
                          },
                          label: { show: false },
                          data: [
                            { value: data.dailyWaterConsumption * data.unitPrice, name: '用水收益', itemStyle: { color: '#1890ff' } },
                            { value: -(data.maintenanceCost / 365), name: '维保成本', itemStyle: { color: '#ff4d4f' } },
                            { value: (data.dailyWaterConsumption * data.unitPrice) - (data.maintenanceCost / 365), name: '净收益', itemStyle: { color: '#52c41a' } },
                          ],
                        },
                      ],
                    }}
                    style={{ height: 180 }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Card
          title={<span className="card-title">月度收益趋势</span>}
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <ReactECharts option={revenueChartOption} style={{ height: 320 }} />
        </Card>
      </div>
    </Spin>
  );
};

export default Dashboard;
