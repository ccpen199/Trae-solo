import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Select, Button, Space, List, Tooltip } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { predictionApi } from '../api';

const { Option } = Select;

function Prediction() {
  const [regionId, setRegionId] = useState(1);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [regionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trend, stats]: any = await Promise.all([
        predictionApi.getTrend(regionId, 24),
        predictionApi.getRegionStats(regionId),
      ]);
      setTrendData(trend || []);
      setRegionStats(stats || {});
    } catch (e) {
      console.error('加载预测数据失败', e);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    try {
      await predictionApi.generate(regionId, 1);
      loadData();
    } catch (e) {}
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预测单量', '实际单量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map((d: any) => d.time),
    },
    yAxis: {
      type: 'value',
      name: '订单量',
    },
    series: [
      {
        name: '预测单量',
        type: 'line',
        smooth: true,
        data: trendData.map((d: any) => d.predicted),
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '实际单量',
        type: 'line',
        smooth: true,
        data: trendData.map((d: any) => (d.actual !== undefined ? d.actual : null)),
        itemStyle: { color: '#52c41a' },
        lineStyle: { type: 'dashed' },
      },
    ],
  };

  const heatmapData: number[][] = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let base = 10;
      if (h >= 11 && h <= 13) base = 45;
      else if (h >= 17 && h <= 19) base = 50;
      else if (h >= 20 && h <= 22) base = 35;
      else if (h >= 2 && h <= 6) base = 3;
      else if (h >= 7 && h <= 10) base = 20;
      else if (h >= 14 && h <= 16) base = 25;

      if (d >= 5) base *= 1.2;

      const noise = Math.floor(Math.random() * 10) - 5;
      heatmapData.push([h, d, Math.max(0, base + noise)]);
    }
  }

  const heatmapOption = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => `${days[p.data[1]]} ${hours[p.data[0]]}: ${p.data[2]}单`,
    },
    grid: { height: '60%', top: '10%' },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { interval: 3 },
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: 60,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#e0f3ff', '#91caff', '#4096ff', '#1677ff', '#003eb3'],
      },
    },
    series: [
      {
        name: '单量热力图',
        type: 'heatmap',
        data: heatmapData,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const factors = [
    { label: '天气因素', value: '晴转多云 26°C', icon: '☀️', impact: '+5%' },
    { label: '节假日因素', value: '非节假日', icon: '📅', impact: '0%' },
    { label: '商圈活动', value: '国贸商圈大促', icon: '🏪', impact: '+20%' },
    { label: '历史趋势', value: '同比上月', icon: '📊', impact: '+12%' },
    { label: '周边运力', value: '充足 (32人在线)', icon: '🚴', impact: '正常' },
    { label: '平台补贴', value: '高峰期补贴', icon: '💰', impact: '+8%' },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日预测单量"
              value={regionStats.today_orders || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="green">{regionStats.order_growth_rate || 0}% 环比增长</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均配送时长"
              value={regionStats.avg_delivery_time || 0}
              suffix="分钟"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="green">优于目标 5分钟</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线骑士数"
              value={regionStats.rider_count || 0}
              suffix="人"
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">运力充足</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>选择区域</div>
                <Select
                  style={{ width: '100%' }}
                  value={regionId}
                  onChange={setRegionId}
                >
                  <Option value={1}>朝阳区</Option>
                  <Option value={2}>海淀区</Option>
                  <Option value={3}>西城区</Option>
                </Select>
              </div>
              <Button type="primary" block icon={<CalendarOutlined />} onClick={handleGenerate}>
                重新生成预测
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="24小时单量预测趋势">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="预测影响因素">
            <List
              size="small"
              dataSource={factors}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>{item.label}</div>
                      <div style={{ fontWeight: 500 }}>{item.value}</div>
                    </div>
                  </Space>
                  <Tag color={item.impact.startsWith('+') ? 'green' : item.impact.startsWith('-') ? 'red' : 'default'}>
                    {item.impact}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="一周单量热力图" style={{ marginTop: 16 }}>
        <ReactECharts option={heatmapOption} style={{ height: 350 }} />
      </Card>
    </div>
  );
}

export default Prediction;
