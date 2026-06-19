import { Card, Row, Col, Statistic, Typography, Tabs, Table, Space, Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

export default function KpiDashboard() {
  const trendOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['响应时长', '处理时长', '完结时长'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['06/12', '06/13', '06/14', '06/15', '06/16', '06/17', '06/18'],
    },
    yAxis: { type: 'value', name: '分钟' },
    series: [
      { name: '响应时长', type: 'line', smooth: true, data: [12, 8, 15, 10, 18, 12, 15.5], itemStyle: { color: '#3B82F6' }, areaStyle: { opacity: 0.1 } },
      { name: '处理时长', type: 'line', smooth: true, data: [45, 52, 38, 60, 48, 55, 52], itemStyle: { color: '#F59E0B' }, areaStyle: { opacity: 0.1 } },
      { name: '完结时长', type: 'line', smooth: true, data: [120, 145, 98, 160, 130, 140, 135], itemStyle: { color: '#10B981' }, areaStyle: { opacity: 0.1 } },
    ],
  };

  const completionOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['提交工单', '完成工单'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['06/12', '06/13', '06/14', '06/15', '06/16', '06/17', '06/18'],
    },
    yAxis: { type: 'value' },
    series: [
      { name: '提交工单', type: 'bar', data: [12, 18, 15, 22, 19, 25, 17], itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } },
      { name: '完成工单', type: 'bar', data: [10, 16, 14, 20, 18, 23, 16], itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  const satisfactionOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '40%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 68, name: '5星', itemStyle: { color: '#10B981' } },
        { value: 32, name: '4星', itemStyle: { color: '#34D399' } },
        { value: 12, name: '3星', itemStyle: { color: '#F59E0B' } },
        { value: 5, name: '2星', itemStyle: { color: '#FB923C' } },
        { value: 3, name: '1星', itemStyle: { color: '#EF4444' } },
      ],
    }],
  };

  const typeDistributionOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '40%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 156, name: '报修', itemStyle: { color: '#3B82F6' } },
        { value: 89, name: '投诉', itemStyle: { color: '#EF4444' } },
        { value: 67, name: '建议', itemStyle: { color: '#10B981' } },
      ],
    }],
  };

  const staffColumns = [
    { title: '处理人员', dataIndex: 'name', width: 100 },
    { title: '处理工单数', dataIndex: 'handled', width: 100, sorter: (a: any, b: any) => a.handled - b.handled },
    { title: '完成工单数', dataIndex: 'completed', width: 100, sorter: (a: any, b: any) => a.completed - b.completed },
    { title: '完结率', dataIndex: 'rate', width: 100, render: (v: number) => <Tag color="green">{v}%</Tag> },
    { title: '平均评分', dataIndex: 'score', width: 100, render: (v: number) => `⭐ ${v}` },
    { title: '平均响应', dataIndex: 'responseTime', width: 100, render: (v: number) => `${v}分钟` },
    { title: '平均处理', dataIndex: 'processTime', width: 100, render: (v: number) => `${v}分钟` },
  ];

  const staffData = [
    { key: '1', name: '李客服', handled: 89, completed: 85, rate: 95.5, score: 4.9, responseTime: 10, processTime: 45 },
    { key: '2', name: '王师傅', handled: 76, completed: 72, rate: 94.7, score: 4.8, responseTime: 12, processTime: 58 },
    { key: '3', name: '张工程', handled: 65, completed: 61, rate: 93.8, score: 4.7, responseTime: 15, processTime: 52 },
    { key: '4', name: '刘物业', handled: 52, completed: 48, rate: 92.3, score: 4.6, responseTime: 18, processTime: 65 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>物业 KPI 看板</Title>
        <Text type="secondary">实时监控物业运营数据与服务质量</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="工单完结率"
              value={92.6}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#10B981' }}
              prefix={<RiseOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="平均响应时长"
              value={15.5}
              suffix="分钟"
              valueStyle={{ color: '#3B82F6' }}
              prefix={<FallOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="平均处理时长"
              value={52}
              suffix="分钟"
              valueStyle={{ color: '#F59E0B' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="平均满意度"
              value={4.8}
              precision={1}
              suffix="分"
              valueStyle={{ color: '#F59E0B' }}
              prefix={<SmileOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="工单趋势分析" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={completionOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="工单类型分布" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={typeDistributionOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="响应/处理时长趋势" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="满意度分布" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={satisfactionOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="物业人员绩效排名"
        size="small"
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginTop: 16 }}
      >
        <Table
          columns={staffColumns}
          dataSource={staffData}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
