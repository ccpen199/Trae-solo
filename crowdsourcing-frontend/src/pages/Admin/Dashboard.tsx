import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  RiseOutlined,
  MoneyCollectOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsApi, taskApi, disputeApi } from '@/api';
import type { PlatformStats, Task, Dispute } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [pendingDisputes, setPendingDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, tasksData, disputesData] = await Promise.all([
        analyticsApi.getPlatformStats(),
        taskApi.getTasks({ page: 1, pageSize: 5 }),
        disputeApi.getDisputes({ status: 'pending', page: 1, pageSize: 5 }),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData.list || []);
      setPendingDisputes(disputesData.list || []);
    } catch (error) {
      console.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const userGrowthChart = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['新增雇主', '新增服务商'],
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增雇主',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110],
        itemStyle: {
          color: '#1E40AF',
        },
      },
      {
        name: '新增服务商',
        type: 'bar',
        data: [80, 120, 100, 60, 50, 90],
        itemStyle: {
          color: '#10B981',
        },
      },
    ],
  };

  const revenueChart = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>营收: ¥{c}',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        data: [58000, 72000, 65000, 89000, 95000, 120000],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: 'rgba(30, 64, 175, 0.1)',
        },
        lineStyle: {
          color: '#1E40AF',
          width: 2,
        },
        itemStyle: {
          color: '#1E40AF',
        },
      },
    ],
  };

  const categoryDistributionChart = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 35, name: 'LOGO设计' },
          { value: 28, name: '品牌设计' },
          { value: 22, name: 'UI设计' },
          { value: 18, name: '插画设计' },
          { value: 15, name: '视频制作' },
          { value: 12, name: '文案策划' },
        ],
      },
    ],
  };

  const taskColumns = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text ellipsis>{text}</Text>,
    },
    {
      title: '预算',
      dataIndex: 'budgetMin',
      key: 'budget',
      render: (_: any, record: Task) => (
        <Text>
          ¥{record.budgetMin.toLocaleString('zh-CN')} - ¥{record.budgetMax.toLocaleString('zh-CN')}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'warning', text: '待审核' },
          published: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          disputed: { color: 'error', text: '有争议' },
        };
        const s = statusMap[status] || statusMap.pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" icon={<EyeOutlined />}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>管理后台</Title>
          <Text type="secondary">平台数据总览与快捷操作</Text>
        </div>
        <Space>
          <Button>刷新数据</Button>
          <Button type="primary">导出报表</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平台总用户"
              value={stats?.totalUsers || 12580}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1E40AF' }}
            />
            <div className="flex justify-between items-center mt-2">
              <Tag color="blue">雇主 {stats?.totalEmployers || 8520}</Tag>
              <Tag color="green">服务商 {stats?.totalProviders || 4060}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="任务总数"
              value={stats?.totalTasks || 3680}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ED1' }}
            />
            <div className="flex justify-between items-center mt-2">
              <Text type="secondary" className="text-sm">
                <ArrowUpOutlined className="text-green-500 mr-1" />
                今日新增 {stats?.todayNewTasks || 28}
              </Text>
              <Tag color="processing">进行中 {stats?.activeTasks || 456}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平台营收"
              value={stats?.totalRevenue || 2580000}
              precision={2}
              prefix={<MoneyCollectOutlined />}
              suffix="元"
              valueStyle={{ color: '#52C41A' }}
            />
            <div className="flex justify-between items-center mt-2">
              <Text type="secondary" className="text-sm">
                本月 ¥{(stats?.monthlyRevenue || 358000).toLocaleString('zh-CN')}
              </Text>
              <Tag color="success">
                <RiseOutlined /> {stats?.revenueGrowth || 18}%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理事项"
              value={stats?.pendingTasks || 42}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#FA8C16' }}
            />
            <div className="flex justify-between items-center mt-2">
              <Tag color="warning">待审核 {stats?.pendingReview || 18}</Tag>
              <Tag color="error">待仲裁 {stats?.pendingDisputes || 8}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <Text strong>今日数据</Text>
              <Text type="secondary" className="text-sm">
                {dayjs().format('YYYY-MM-DD')}
              </Text>
            </div>
            <List
             
              dataSource={[
                {
                  icon: <UserOutlined className="text-blue-600" />,
                  label: '新增注册',
                  value: stats?.todayNewUsers || 56,
                  trend: '+12%',
                  trendColor: 'text-green-500',
                },
                {
                  icon: <FileTextOutlined className="text-purple-600" />,
                  label: '新增任务',
                  value: stats?.todayNewTasks || 28,
                  trend: '+8%',
                  trendColor: 'text-green-500',
                },
                {
                  icon: <CheckCircleOutlined className="text-green-600" />,
                  label: '完成任务',
                  value: stats?.todayCompletedTasks || 32,
                  trend: '+15%',
                  trendColor: 'text-green-500',
                },
                {
                  icon: <MoneyCollectOutlined className="text-yellow-600" />,
                  label: '今日营收',
                  value: `¥${(stats?.todayRevenue || 18600).toLocaleString('zh-CN')}`,
                  trend: '+22%',
                  trendColor: 'text-green-500',
                },
                {
                  icon: <WarningOutlined className="text-red-500" />,
                  label: '新增争议',
                  value: stats?.todayNewDisputes || 3,
                  trend: '-1',
                  trendColor: 'text-green-500',
                },
              ]}
              renderItem={item => (
                <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <Text>{item.label}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Text strong>{item.value}</Text>
                      <Text className={`text-xs ${item.trendColor}`}>{item.trend}</Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="用户增长趋势">
            <ReactECharts option={userGrowthChart} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={10}>
          <Card title="营收趋势">
            <ReactECharts option={revenueChart} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card
            title="最新任务"
            extra={<Button type="link">查看全部</Button>}
          >
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
             
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="任务分类分布">
                <ReactECharts option={categoryDistributionChart} style={{ height: 200 }} />
              </Card>
            </Col>
            <Col span={24}>
              <Card
                title="待处理争议"
                extra={<Button type="link">前往处理</Button>}
               
              >
                <List
                 
                  dataSource={pendingDisputes}
                  locale={{ emptyText: '暂无待处理争议' }}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" icon={<EyeOutlined />}>
                          处理
                        </Button>,
                      ]}
                      style={{ paddingLeft: 0, paddingRight: 0 }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<WarningOutlined />} className="bg-orange-100" />}
                        title={
                          <div className="flex items-center gap-2">
                            <Text ellipsis style={{ maxWidth: 120 }}>{item.task?.title}</Text>
                            <Tag color="warning">
                              {DISPUTE_TYPE_MAP[item.type]}
                            </Tag>
                          </div>
                        }
                        description={
                          <Text type="secondary" className="text-xs">
                            <ClockCircleOutlined className="mr-1" />
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card title="快捷操作">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<FileTextOutlined />}>
              任务管理
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<TrophyOutlined />}>
              服务商审核
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<WarningOutlined />}>
              争议仲裁
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<FileTextOutlined />}>
              财务中心
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<SafetyOutlined />}>
              合规审计
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<UserOutlined />}>
              用户管理
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<FileTextOutlined />}>
              系统设置
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Button block icon={<RiseOutlined />}>
              数据报表
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const DISPUTE_TYPE_MAP: Record<string, string> = {
  payment: '支付纠纷',
  quality: '质量纠纷',
  deadline: '交付时间',
  scope: '需求范围',
  communication: '沟通问题',
  other: '其他',
};

export default AdminDashboard;
