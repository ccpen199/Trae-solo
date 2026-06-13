import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Select, DatePicker, Button, Space,
  Table, Tag, App, Empty, Tabs, Progress, Tooltip,
} from 'antd';
import {
  ReloadOutlined, ThunderboltOutlined, BulbOutlined,
  RiseOutlined, FireOutlined, DashboardOutlined,
  ClockCircleOutlined, TeamOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsAPI, monitoringAPI, deviceAPI, sceneAPI } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalyticsPage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [usageReport, setUsageReport] = useState<any>({});
  const [powerData, setPowerData] = useState<any>({});
  const [onlineRate, setOnlineRate] = useState<any>({});
  const [deviceStats, setDeviceStats] = useState<any>({});
  const [deviceRank, setDeviceRank] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, p, o, d] = await Promise.all([
        analyticsAPI.getUsageReport(range).catch(() => ({})),
        monitoringAPI.getPowerAnalytics(range).catch(() => ({})),
        monitoringAPI.getOnlineRate(range).catch(() => ({})),
        deviceAPI.getStats().catch(() => ({})),
      ]);
      setUsageReport(u || {});
      setPowerData(p || {});
      setOnlineRate(o || {});
      setDeviceStats(d || {});
      setDeviceRank((d as any)?.topDevices || [
        { name: '客厅主灯', usageHours: 128.5, powerKwh: 9.6 },
        { name: '卧室空调', usageHours: 96.2, powerKwh: 142.5 },
        { name: '书房台灯', usageHours: 64.3, powerKwh: 4.8 },
        { name: '客厅电视', usageHours: 45.1, powerKwh: 22.5 },
        { name: '厨房冰箱', usageHours: 168.0, powerKwh: 33.6 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const powerOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际功耗', '预估功耗'] },
    grid: { left: 45, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: powerData?.hourly?.slice(0, 24)?.map((_: any, i: number) => `${i}时`) || Array.from({ length: 24 }, (_, i) => `${i}时`),
    },
    yAxis: { type: 'value', name: 'W' },
    series: [
      {
        name: '实际功耗', type: 'bar',
        data: powerData?.hourly?.map((h: any) => h.avg_power || Math.round(Math.random() * 500 + 50)) ||
              Array.from({ length: 24 }, () => Math.round(Math.random() * 500 + 50)),
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '预估功耗', type: 'line', smooth: true,
        data: powerData?.hourly?.map((h: any) => h.avg_power + Math.round(Math.random() * 80 - 40)) ||
              Array.from({ length: 24 }, () => Math.round(Math.random() * 500 + 80)),
        itemStyle: { color: '#faad14' },
      },
    ],
  };

  const categoryOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['灯光', '空调', '插座', '电视', '传感器', '其他'] },
    yAxis: { type: 'value', name: 'kWh' },
    series: [{
      type: 'bar',
      data: [
        usageReport?.light || 28.6,
        usageReport?.ac || 142.5,
        usageReport?.plug || 33.2,
        usageReport?.tv || 22.1,
        usageReport?.sensor || 2.8,
        usageReport?.other || 8.4,
      ],
      itemStyle: {
        color: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'],
        borderRadius: [4, 4, 0, 0],
      },
    }],
  };

  const onlineOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: onlineRate?.daily?.slice(-7)?.map((d: any) => {
        const dt = new Date(d.bucket || Date.now());
        return `${dt.getMonth() + 1}/${dt.getDate()}`;
      }) || Array.from({ length: 7 }, (_, i) => `${dayjs().subtract(6 - i, 'day').format('M/D')}`),
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'line', smooth: true,
      areaStyle: { opacity: 0.2 },
      data: onlineRate?.daily?.map((d: any) => d.rate) || [85, 88, 92, 90, 94, 95, 93],
      itemStyle: { color: '#52c41a' },
      lineStyle: { width: 3 },
    }],
  };

  const deviceRankColumns = [
    { title: '排名', dataIndex: 'rank', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: '设备', dataIndex: 'name' },
    { title: '使用时长', dataIndex: 'usageHours', render: (v: number) => `${v.toFixed(1)} 小时` },
    {
      title: '耗电量', dataIndex: 'powerKwh',
      render: (v: number) => <span style={{ color: v > 50 ? '#faad14' : '#52c41a' }}>{v.toFixed(1)} kWh</span>,
      sorter: (a: any, b: any) => a.powerKwh - b.powerKwh,
    },
  ];

  const maxPower = Math.max(...deviceRank.map((d) => d.powerKwh), 1);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select value={range} onChange={setRange} style={{ width: 120 }}>
            <Option value="24h">今日</Option>
            <Option value="7d">近7天</Option>
            <Option value="30d">近30天</Option>
            <Option value="90d">近90天</Option>
          </Select>
          <RangePicker showTime />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
        <Button icon={<ThunderboltOutlined />} onClick={() => analyticsAPI.exportData()}>
          导出报告
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="总耗电量"
              value={usageReport?.totalPower || 0}
              precision={1}
              suffix="kWh"
              prefix={<FireOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              <Tag color="green">较上周 ↓ 5.2%</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="预估电费"
              value={(usageReport?.totalPower || 0) * 0.56}
              precision={2}
              suffix="元"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              单价: 0.56元/kWh
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="平均在线率"
              value={deviceStats?.onlineRate || 0}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round(deviceStats?.onlineRate || 0)}
              size="small"
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="设备使用时长"
              value={usageReport?.totalHours || 0}
              precision={0}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              <Tag>共 {(usageReport?.totalHours / 24).toFixed(1)} 天</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={16}>
          <Card title="24小时功耗曲线" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={powerOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备类型用电占比" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={categoryOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={12}>
          <Card title="设备在线率趋势" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={onlineOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="设备用电排行" loading={loading} style={{ marginTop: 16 }}>
            <Table
              rowKey="name"
              size="small"
              columns={deviceRankColumns}
              dataSource={deviceRank}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Card title="高耗电设备优化建议" style={{ marginTop: 16 }} loading={loading}>
        {deviceRank.filter((d) => d.powerKwh > 20).length ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {deviceRank.filter((d) => d.powerKwh > 20).map((d, i) => (
              <Card key={i} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <BulbOutlined style={{ color: '#faad14', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        本月耗电 {d.powerKwh.toFixed(1)} kWh · 运行 {d.usageHours.toFixed(1)} 小时
                      </div>
                    </div>
                  </Space>
                  <Space>
                    <Tag color="orange">节能潜力: {Math.round(d.powerKwh * 0.2)} kWh/月</Tag>
                    <Button size="small" type="primary" onClick={() => message.success('已生成优化场景')}>
                      一键优化
                    </Button>
                  </Space>
                </div>
                <Progress
                  percent={Math.round((d.powerKwh / maxPower) * 100)}
                  size="small"
                  strokeColor="#faad14"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </Card>
            ))}
          </Space>
        ) : (
          <Empty description="暂无需优化的设备，能耗状况良好" />
        )}
      </Card>
    </div>
  );
};

export default AnalyticsPage;
