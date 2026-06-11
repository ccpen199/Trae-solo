import { useState } from 'react';
import { Card, Row, Col, Tag, Badge, Progress, Table, Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, GaugeChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GaugeChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

interface ServiceRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  availability: number;
  avgResponseTime: number;
  qps: number;
  errorRate: number;
  lastCheckAt: string;
}

const mockData: ServiceRecord[] = [
  { id: 'SVC001', name: '社保查询服务', category: '社会保障', status: '正常', availability: 99.98, avgResponseTime: 120, qps: 580, errorRate: 0.02, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC002', name: '医保结算服务', category: '医疗卫生', status: '正常', availability: 99.95, avgResponseTime: 230, qps: 420, errorRate: 0.05, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC003', name: '公积金查询服务', category: '住房保障', status: '警告', availability: 98.5, avgResponseTime: 580, qps: 350, errorRate: 1.5, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC004', name: '户籍办理服务', category: '户籍管理', status: '正常', availability: 99.9, avgResponseTime: 150, qps: 280, errorRate: 0.1, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC005', name: '不动产登记服务', category: '不动产', status: '异常', availability: 95.2, avgResponseTime: 1200, qps: 80, errorRate: 4.8, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC006', name: '税务申报服务', category: '税务服务', status: '正常', availability: 99.97, avgResponseTime: 100, qps: 620, errorRate: 0.03, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC007', name: '补贴发放服务', category: '补贴监管', status: '正常', availability: 99.9, avgResponseTime: 180, qps: 150, errorRate: 0.1, lastCheckAt: '2025-06-09 10:00:00' },
  { id: 'SVC008', name: '证照核验服务', category: '证照管理', status: '警告', availability: 99.0, avgResponseTime: 450, qps: 200, errorRate: 1.0, lastCheckAt: '2025-06-09 10:00:00' },
];

const responseOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['平均响应时间(ms)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
  yAxis: { type: 'value', name: 'ms' },
  series: [{
    name: '平均响应时间(ms)', type: 'line', smooth: true,
    data: [150, 180, 230, 280, 200, 190, 260, 310, 250, 180],
    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(250,173,20,0.3)' },
      { offset: 1, color: 'rgba(250,173,20,0.02)' },
    ]) },
    lineStyle: { color: '#faad14' },
    itemStyle: { color: '#faad14' },
  }],
};

const gaugeOption = {
  series: [{
    type: 'gauge',
    startAngle: 200,
    endAngle: -20,
    min: 0,
    max: 100,
    detail: { formatter: '{value}%' },
    data: [{ value: 99.8, name: '整体可用性' }],
    axisLine: { lineStyle: { width: 20, color: [[0.95, '#ff4d4f'], [0.99, '#faad14'], [1, '#52c41a']] } },
  }],
};

const ServiceMonitor: React.FC = () => {
  const [data] = useState(mockData);
  const [searchText, setSearchText] = useState('');

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.category.includes(searchText));

  const statusColor: Record<string, string> = { '正常': 'success', '警告': 'warning', '异常': 'error' };

  const columns = [
    { title: '服务ID', dataIndex: 'id', width: 90 },
    { title: '服务名称', dataIndex: 'name', width: 150 },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => <Badge status={statusColor[v] as 'success' | 'warning' | 'error'} text={v} />,
    },
    {
      title: '可用性', dataIndex: 'availability', width: 110,
      render: (v: number) => <Progress percent={v} size="small" status={v >= 99.9 ? 'success' : v >= 99 ? 'normal' : 'exception'} />,
    },
    { title: '平均响应(ms)', dataIndex: 'avgResponseTime', width: 110, render: (v: number) => <span style={{ color: v > 500 ? '#ff4d4f' : v > 300 ? '#faad14' : '#52c41a' }}>{v}</span> },
    { title: 'QPS', dataIndex: 'qps', width: 80 },
    { title: '错误率(%)', dataIndex: 'errorRate', width: 100, render: (v: number) => <span style={{ color: v > 1 ? '#ff4d4f' : '#52c41a' }}>{v}%</span> },
    { title: '最后检查', dataIndex: 'lastCheckAt', width: 170 },
  ];

  const normalCount = data.filter((i) => i.status === '正常').length;
  const warnCount = data.filter((i) => i.status === '警告').length;
  const errorCount = data.filter((i) => i.status === '异常').length;

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card><Badge status="success" text={<span style={{ fontSize: 16 }}>正常服务：<strong>{normalCount}</strong></span>} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Badge status="warning" text={<span style={{ fontSize: 16 }}>警告服务：<strong>{warnCount}</strong></span>} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Badge status="error" text={<span style={{ fontSize: 16 }}>异常服务：<strong>{errorCount}</strong></span>} /></Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="响应时间趋势" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={responseOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="整体可用性" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={gaugeOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索服务名称/分类"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default ServiceMonitor;
