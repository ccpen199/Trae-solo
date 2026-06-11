import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Progress, Tabs, Button, Space, Alert, Badge, Table } from 'antd';
import {
  WarningOutlined,
  RocketOutlined,
  RiseOutlined,
  ArrowDownOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '../services/api';

function AdminDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [complianceData, setComplianceData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alertsData, overviewData, heatmap, compliance] = await Promise.all([
        apiService.get('/alerts', { status: 'active' }),
        apiService.get('/dashboard/overview'),
        apiService.get('/dashboard/heatmap-data'),
        apiService.get('/dashboard/compliance-rate'),
      ]);
      setAlerts(alertsData as any[]);
      setStats(overviewData);
      setHeatmapData(heatmap as any[]);
      setComplianceData(compliance as any);
    } catch (err) {
      console.error(err);
    }
  };

  const severityMap: Record<string, string> = {
    critical: '#ff4d4f',
    high: '#fa8c16',
    medium: '#faad14',
    low: '#1677ff',
  };

  const alertTypeIcons: Record<string, any> = {
    '滞港风险': <WarningOutlined />,
    '甩柜预警': <CloseCircleOutlined />,
    '单证缺失': <WarningOutlined />,
    '船舶延误': <ClockCircleOutlined />,
    '费用异常': <RiseOutlined />,
  };

  const defaultPortCapacity = [
    { name: '上海港', vessels: 8, capacity: 980, emptyRate: 8 },
    { name: '宁波港', vessels: 5, capacity: 680, emptyRate: 9 },
    { name: '深圳港', vessels: 6, capacity: 820, emptyRate: 6 },
    { name: '新加坡港', vessels: 4, capacity: 860, emptyRate: 12 },
    { name: '釜山港', vessels: 3, capacity: 540, emptyRate: 11 },
    { name: '鹿特丹港', vessels: 5, capacity: 720, emptyRate: 18 },
    { name: '汉堡港', vessels: 4, capacity: 620, emptyRate: 22 },
    { name: '洛杉矶港', vessels: 6, capacity: 750, emptyRate: 15 },
  ];

  const normalizedPortCapacity = Array.isArray((heatmapData as any)?.ports)
    ? (heatmapData as any).ports.map((port: any) => ({
        name: port.name,
        vessels: port.routes || port.vessels || 0,
        capacity: port.value || port.capacity || 0,
        emptyRate: Math.round((port.emptyRate || 0) * 100),
      }))
    : Array.isArray(heatmapData) && heatmapData.length > 0
      ? heatmapData.map((port: any) => ({
          name: port.name,
          vessels: port.vessels || port.value?.[2] || 0,
          capacity: port.capacity || (port.value?.[2] || 0) * 5000,
          emptyRate: port.emptyRate || 0,
        }))
      : defaultPortCapacity;

  const heatmapChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: { data: ['周运力', '在线船舶', '空载率'], top: 0 },
    grid: { left: '4%', right: '4%', bottom: '8%', top: 48, containLabel: true },
    xAxis: {
      type: 'category',
      data: normalizedPortCapacity.map((port: any) => port.name),
      axisLabel: { rotate: 24, interval: 0 },
    },
    yAxis: [
      { type: 'value', name: 'TEU/周' },
      { type: 'value', name: '船舶/空载率', axisLabel: { formatter: '{value}' } },
    ],
    series: [
      {
        name: '周运力',
        type: 'bar',
        data: normalizedPortCapacity.map((port: any) => port.capacity),
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '在线船舶',
        type: 'line',
        yAxisIndex: 1,
        data: normalizedPortCapacity.map((port: any) => port.vessels),
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '空载率',
        type: 'line',
        yAxisIndex: 1,
        data: normalizedPortCapacity.map((port: any) => port.emptyRate),
        smooth: true,
        itemStyle: { color: '#faad14' },
      },
    ],
  };

  const complianceChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: (complianceData.byRoute || []).map((r: any) => r.route),
      axisLabel: { rotate: 30, interval: 0 },
    },
    yAxis: { type: 'value', max: 100, name: '履约率(%)' },
    series: [
      {
        name: '履约率',
        type: 'bar',
        data: (complianceData.byRoute || []).map((r: any) => r.rate),
        itemStyle: {
          color: (params: any) => {
            return params.value >= 90 ? '#52c41a' : params.value >= 80 ? '#faad14' : '#ff4d4f';
          },
        },
        label: { show: true, position: 'top', formatter: '{c}%' },
      },
    ],
  };

  const pieChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '延误原因',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: (complianceData.reasons || []).map((r: any) => ({
          value: r.count,
          name: r.reason,
        })),
      },
    ],
  };

  const alertColumns = [
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: any) => (
        <Space>
          <span style={{ color: severityMap[record.severity] }}>
            {alertTypeIcons[type] || <WarningOutlined />}
          </span>
          <span>{type}</span>
        </Space>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severityMap[severity]} style={{ textTransform: 'capitalize' }}>
          {severity === 'critical' ? '紧急' : severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '预警消息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'red' : status === 'acknowledged' ? 'orange' : 'green'}>
          {status === 'active' ? '未处理' : status === 'acknowledged' ? '已确认' : '已解决'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">处理</Button>
          <Button type="link" size="small">忽略</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">后台管理</div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="总船舶数"
              value={stats.totalVessels || 0}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="活跃航次"
              value={stats.activeVoyages || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="总订单数"
              value={stats.totalOrders || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="待处理预警"
              value={stats.activeAlerts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="运力热力分布" className="dashboard-card">
            <div style={{ height: '350px', position: 'relative' }}>
              <ReactECharts option={heatmapChartOption} style={{ height: '100%' }} />
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'white', padding: 12, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>覆盖港口</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>12 个</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="异常预警" className="dashboard-card" extra={<Button type="link" size="small">查看全部</Button>}>
            {alerts.slice(0, 5).map((alert: any) => (
              <div
                key={alert.id}
                className={`alert-item ${alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : alert.severity === 'medium' ? 'medium' : 'low'}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500' }}>{alert.type}</span>
                  <Tag color={severityMap[alert.severity]} style={{ padding: '0 6px' }}>
                    {alert.severity === 'critical' ? '紧急' : alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                  </Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>{alert.message}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="航次履约率看板" className="dashboard-card">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#999' }}>整体履约率</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#52c41a' }}>
                {complianceData.overallRate || 0}%
              </div>
              <div style={{ color: '#52c41a', fontSize: 12 }}>
                <RiseOutlined /> 较上月提升 2.3%
              </div>
            </div>
            <ReactECharts option={complianceChartOption} style={{ height: '280px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="延误原因分析" className="dashboard-card">
            <ReactECharts option={pieChartOption} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      <Card title="预警管理" className="dashboard-card" style={{ marginTop: 16 }}>
        <Tabs
          items={[
            { key: 'active', label: <span><Badge dot status="error" /> 待处理</span> },
            { key: 'processing', label: '处理中' },
            { key: 'resolved', label: '已解决' },
            { key: 'all', label: '全部' },
          ]}
        >
          <Table
            rowKey="id"
            columns={alertColumns}
            dataSource={alerts}
            pagination={{ pageSize: 8 }}
            size="small"
          />
        </Tabs>
      </Card>
    </div>
  );
}

export default AdminDashboard;
