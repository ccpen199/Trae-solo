import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, List, Typography } from 'antd';
import {
  StockOutlined,
  ImportOutlined,
  ExportOutlined,
  WarningOutlined,
  DollarOutlined,
  RightOutlined,
  PlusOutlined,
  ScanOutlined,
  CoffeeOutlined,
  MedicineBoxOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { http } from '@/services/api';
import { DashboardMetrics, AnomalyRecord, AnomalyTypeLabels, AnomalyStatus, Priority, PriorityLabels } from '@/types';
import dayjs from 'dayjs';

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const response = await http.get<DashboardMetrics>('/statistics/dashboard');
      return response.data;
    },
    initialData: {
      totalInventory: 1256,
      dailyEntry: 23,
      dailySlaughter: 18,
      pendingAnomalies: 5,
      monthlyProfit: 45230,
      inventoryByType: [
        { type: 'pig' as const, count: 565, percentage: 45 },
        { type: 'cattle' as const, count: 314, percentage: 25 },
        { type: 'sheep' as const, count: 251, percentage: 20 },
        { type: 'chicken' as const, count: 126, percentage: 10 },
      ],
      recentAnomalies: [],
    },
  });

  const pieChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}头 ({d}%)',
    },
    legend: {
      bottom: 10,
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: metrics?.inventoryByType.map((item) => ({
          value: item.count,
          name: item.type === 'pig' ? '猪' : item.type === 'cattle' ? '牛' : item.type === 'sheep' ? '羊' : '鸡',
        })),
      },
    ],
  };

  const lineChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['毛利', '出栏数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月'],
    },
    yAxis: [
      {
        type: 'value',
        name: '毛利(元)',
      },
      {
        type: 'value',
        name: '出栏数(头)',
      },
    ],
    series: [
      {
        name: '毛利',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: [32000, 38000, 42000, 45230],
      },
      {
        name: '出栏数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [120, 145, 168, 180],
      },
    ],
  };

  const anomalyColumns = [
    {
      title: '耳标编号',
      dataIndex: 'earTagId',
      key: 'earTagId',
    },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => AnomalyTypeLabels[type as keyof typeof AnomalyTypeLabels] || type,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          [Priority.LOW]: 'default',
          [Priority.MEDIUM]: 'blue',
          [Priority.HIGH]: 'orange',
          [Priority.CRITICAL]: 'red',
        };
        return (
          <Tag color={colorMap[priority] || 'default'}>
            {PriorityLabels[priority as keyof typeof PriorityLabels] || priority}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          [AnomalyStatus.PENDING]: 'orange',
          [AnomalyStatus.PROCESSING]: 'processing',
          [AnomalyStatus.RESOLVED]: 'success',
          [AnomalyStatus.DISMISSED]: 'default',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {status === AnomalyStatus.PENDING ? '待处理' :
             status === AnomalyStatus.PROCESSING ? '处理中' :
             status === AnomalyStatus.RESOLVED ? '已解决' : '已驳回'}
          </Tag>
        );
      },
    },
    {
      title: '发生时间',
      dataIndex: ['details', 'detectedAt'],
      key: 'detectedAt',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" onClick={() => navigate('/anomaly/queue')}>
          处理
        </Button>
      ),
    },
  ];

  const mockAnomalies: (AnomalyRecord & { key: string })[] = [
    {
      id: '1',
      key: '1',
      earTagId: 'E12345',
      type: 'consecutive_deviation',
      details: {
        description: '连续3天日增重异常',
        detectedAt: new Date().toISOString(),
        metrics: { actualValue: 0.5, baselineValue: 0.8, deviation: -37.5 },
      },
      status: AnomalyStatus.PROCESSING,
      priority: Priority.CRITICAL,
      notifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      key: '2',
      earTagId: 'E12346',
      type: 'vaccine_overdue',
      details: {
        description: '猪瘟疫苗逾期未接种',
        detectedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      status: AnomalyStatus.PENDING,
      priority: Priority.HIGH,
      notifications: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const quickActions = [
    {
      icon: <ScanOutlined style={{ fontSize: 24 }} />,
      title: '扫码进场',
      description: 'UHF耳标扫码登记',
      onClick: () => navigate('/livestock/admission'),
    },
    {
      icon: <CoffeeOutlined style={{ fontSize: 24 }} />,
      title: '饲喂录入',
      description: '记录每日饲喂情况',
      onClick: () => navigate('/feeding/record'),
    },
    {
      icon: <MedicineBoxOutlined style={{ fontSize: 24 }} />,
      title: '防疫登记',
      description: '疫苗接种记录',
      onClick: () => navigate('/vaccination/record'),
    },
    {
      icon: <CalculatorOutlined style={{ fontSize: 24 }} />,
      title: '结算出栏',
      description: '出栏结算审批',
      onClick: () => navigate('/settlement/slaughter'),
    },
  ];

  const todoItems = [
    { title: '[健康排查] 耳标: E12345', type: 'critical' },
    { title: '[防疫提醒] 10头即将到期', type: 'high' },
    { title: '[审批] 出栏审批单待处理', type: 'medium' },
    { title: '[异常] 增重异常3头', type: 'high' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Typography.Title level={4} style={{ marginBottom: 16 }}>
            数据概览
          </Typography.Title>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={4}>
          <Card hoverable>
            <Statistic
              title="总存栏数"
              value={metrics?.totalInventory}
              suffix="头"
              prefix={<StockOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={4}>
          <Card hoverable>
            <Statistic
              title="今日进场"
              value={metrics?.dailyEntry}
              suffix="头"
              prefix={<ImportOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={4}>
          <Card hoverable>
            <Statistic
              title="今日出栏"
              value={metrics?.dailySlaughter}
              suffix="头"
              prefix={<ExportOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={4}>
          <Card hoverable>
            <Statistic
              title="待处理异常"
              value={metrics?.pendingAnomalies}
              suffix="个"
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={4}>
          <Card hoverable>
            <Statistic
              title="本月毛利"
              value={metrics?.monthlyProfit}
              precision={0}
              prefix="¥"
              suffix=""
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card
            title="待办事项"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/anomaly/queue')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={todoItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    description={
                      <Space>
                        <Tag
                          color={
                            item.type === 'critical'
                              ? 'red'
                              : item.type === 'high'
                              ? 'orange'
                              : 'blue'
                          }
                        >
                          {item.type === 'critical' ? '紧急' : item.type === 'high' ? '高' : '中'}
                        </Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} sm={12} key={index}>
                  <Card
                    hoverable
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                    onClick={action.onClick}
                  >
                    <div style={{ color: '#1890ff', marginBottom: 8 }}>{action.icon}</div>
                    <div style={{ fontWeight: 'bold' }}>{action.title}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{action.description}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card title="存栏结构分布">
            <ReactECharts option={pieChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card title="毛利趋势">
            <ReactECharts option={lineChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="近期异常监控"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/anomaly/queue')}>
                查看全部异常 <RightOutlined />
              </Button>
            }
          >
            <Table
              columns={anomalyColumns}
              dataSource={mockAnomalies}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
