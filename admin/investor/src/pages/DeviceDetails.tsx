import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Progress,
  List,
  Tag,
  Statistic,
  Spin,
  Button,
  Breadcrumb,
  App as AntdApp,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  RiseOutlined,
  ReloadOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { DeviceDetail } from '../services/investorApi';
import DeviceStatusBadge from '../components/DeviceStatusBadge';

const mockDevice: DeviceDetail = {
  id: 'DEV001',
  name: '浦东商业中心-1号机组',
  model: 'WD-S800-STD',
  projectName: '上海浦东新区商业综合体供水项目',
  location: '上海市浦东新区世纪大道100号',
  installDate: '2023-06-15',
  status: 'online',
  runHours: 8760,
  temperature: 28.5,
  pressure: 0.45,
  todayWater: 18560,
  totalWater: 5624800,
  todayRevenue: 92800,
  totalRevenue: 28124000,
  faultCodes: [
    {
      code: 'P023',
      description: '高压泵压力异常波动',
      time: '2024-06-18 14:32',
      level: 'warning',
    },
    {
      code: 'F012',
      description: '前置滤芯寿命低于20%',
      time: '2024-06-16 09:15',
      level: 'warning',
    },
    {
      code: 'T001',
      description: '温度传感器校准提醒',
      time: '2024-06-10 11:00',
      level: 'error',
    },
  ],
  energyCurve: Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, '0')}:00`,
    value: 40 + Math.sin(i / 3) * 15 + Math.random() * 10,
  })),
  revenueStats: {
    daily: 92800,
    weekly: 648000,
    monthly: 2785000,
    yearly: 33842000,
  },
};

const levelConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  warning: { color: '#faad14', bgColor: 'rgba(250,173,20,0.08)', icon: '!' },
  error: { color: '#ff4d4f', bgColor: 'rgba(255,77,79,0.08)', icon: '×' },
  critical: { color: '#722ed1', bgColor: 'rgba(114,46,209,0.08)', icon: '!!' },
};

const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeviceDetail>(mockDevice);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setData({ ...mockDevice, id: id || 'DEV001' });
      } catch {
        message.error('获取设备详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, message]);

  const energyOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#f0f0f0',
      textStyle: { color: '#333' },
    },
    grid: { left: 48, right: 24, top: 24, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.energyCurve.map((e) => e.time),
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#8c8c8c', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: '#8c8c8c', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#8c8c8c', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2.5,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#ff7a45' },
            ],
          },
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255,122,69,0.35)' },
              { offset: 1, color: 'rgba(255,122,69,0.02)' },
            ],
          },
        },
        data: data.energyCurve.map((e) => e.value),
        animationDuration: 1500,
      },
    ],
  };

  const runHoursProgress = (data.runHours / (365 * 24 * 2)) * 100;

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Breadcrumb
            items={[
              { title: <a onClick={() => navigate('/dashboard')}>首页</a> },
              { title: <a onClick={() => navigate('/devices-map')}>设备地图</a> },
              { title: data.name },
            ]}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新数据
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
          </div>
        </div>

        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          bodyStyle={{ padding: 24 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: '1px solid #f0f0f0',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 28,
                }}
              >
                <DashboardOutlined />
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', color: '#1f1f1f' }}>{data.name}</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#8c8c8c' }}>
                  <span>设备编号：{data.id}</span>
                  <span>型号：{data.model}</span>
                  <DeviceStatusBadge status={data.status} size="small" />
                </div>
              </div>
            </div>
          </div>

          <Descriptions column={2} size="small">
            <Descriptions.Item label="所属项目">{data.projectName}</Descriptions.Item>
            <Descriptions.Item label="安装位置">{data.location}</Descriptions.Item>
            <Descriptions.Item label="安装日期">{data.installDate}</Descriptions.Item>
            <Descriptions.Item label="运行时长">
              <span style={{ fontWeight: 500 }}>{data.runHours.toLocaleString()}</span> 小时
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {((data.runHours / 24).toFixed(0))}天
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              title={<span className="card-title">运行状态</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(100, runHoursProgress)}
                  strokeColor={{
                    '0%': '#36cfc9',
                    '50%': '#1890ff',
                    '100%': '#722ed1',
                  }}
                  trailColor="#f0f0f0"
                  width={160}
                  format={() => (
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>运行占比</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1f1f1f' }}>
                        {Math.min(100, runHoursProgress).toFixed(0)}%
                      </div>
                    </div>
                  )}
                />
              </div>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>当前温度</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: data.temperature > 40 ? '#ff4d4f' : '#1890ff' }}>
                      {data.temperature.toFixed(1)}°C
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>工作压力</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#722ed1' }}>
                      {data.pressure.toFixed(2)}MPa
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>今日产水</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
                      {(data.todayWater / 1000).toFixed(1)}m³
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>累计产水</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                      {(data.totalWater / 10000).toFixed(0)}万m³
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title={<span className="card-title">故障记录</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
              extra={
                <Tag color={data.faultCodes.length > 0 ? 'orange' : 'green'}>
                  {data.faultCodes.length} 条记录
                </Tag>
              }
              bodyStyle={{ padding: '8px 0 8px 16px' }}
            >
              <List
                dataSource={data.faultCodes}
                renderItem={(item) => {
                  const cfg = levelConfig[item.level];
                  return (
                    <List.Item style={{ padding: '12px 16px 12px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: cfg.bgColor,
                            color: cfg.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, color: '#1f1f1f' }}>
                              故障码 {item.code}
                            </span>
                            <Tag
                              color={item.level === 'warning' ? 'orange' : item.level === 'error' ? 'red' : 'purple'}
                              style={{ margin: 0 }}
                            >
                              {item.level === 'warning' ? '警告' : item.level === 'error' ? '错误' : '严重'}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>
                            <WarningOutlined style={{ marginRight: 4, color: cfg.color }} />
                            {item.description}
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            发生时间：{item.time}
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
              {data.faultCodes.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: '#8c8c8c' }}>
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 12 }} />
                  <div>暂无故障记录，设备运行良好</div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title={<span className="card-title">收益统计</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
              bodyStyle={{ padding: 20 }}
            >
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(24,144,255,0.1), rgba(24,144,255,0.04))',
                    }}
                  >
                    <Statistic
                      title="今日收益"
                      value={data.revenueStats.daily}
                      prefix="¥"
                      precision={0}
                      valueStyle={{ fontSize: 18, color: '#1890ff', fontWeight: 600 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(82,196,26,0.1), rgba(82,196,26,0.04))',
                    }}
                  >
                    <Statistic
                      title="本周收益"
                      value={data.revenueStats.weekly}
                      prefix="¥"
                      precision={0}
                      valueStyle={{ fontSize: 18, color: '#52c41a', fontWeight: 600 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(114,46,209,0.1), rgba(114,46,209,0.04))',
                    }}
                  >
                    <Statistic
                      title="本月收益"
                      value={data.revenueStats.monthly}
                      prefix="¥"
                      precision={0}
                      valueStyle={{ fontSize: 18, color: '#722ed1', fontWeight: 600 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(250,173,20,0.1), rgba(250,173,20,0.04))',
                    }}
                  >
                    <Statistic
                      title="年度收益"
                      value={data.revenueStats.yearly}
                      prefix="¥"
                      precision={0}
                      valueStyle={{ fontSize: 18, color: '#faad14', fontWeight: 600 }}
                    />
                  </div>
                </Col>
              </Row>
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.12), rgba(114,46,209,0.12))',
                  borderLeft: '4px solid #1890ff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>累计收益</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#1f1f1f' }}>
                      ¥{data.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <RiseOutlined style={{ fontSize: 36, color: '#52c41a' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title={<span className="card-title">24小时能耗曲线</span>}
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <ReactECharts option={energyOption} style={{ height: 300 }} />
        </Card>
      </div>
    </Spin>
  );
};

export default DeviceDetails;
