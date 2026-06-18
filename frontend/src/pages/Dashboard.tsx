import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Avatar, Tag, Typography, Space, Button, Empty } from 'antd';
import {
  FileTextOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  EyeOutlined,
  BellOutlined,
  CalendarOutlined,
  UserOutlined,
  RiseOutlined,
  ToolOutlined,
  ShopOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore, UserRole, roleNames } from '../store/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface StatData {
  demandCount: number;
  contractCount: number;
  todoCount: number;
  riskCount: number;
}

interface ProjectProgress {
  id: string;
  name: string;
  status: string;
  progress: number;
  updateTime: string;
  operator: string;
}

const roleQuickActions: Record<UserRole, { icon: React.ReactNode; label: string; path: string; color: string }[]> = {
  admin: [
    { icon: <BarChartOutlined />, label: '管理后台', path: '/admin/dashboard', color: '#1890ff' },
    { icon: <UserOutlined />, label: '用户管理', path: '/admin/users', color: '#722ed1' },
    { icon: <FileProtectOutlined />, label: '合同跟踪', path: '/admin/contracts', color: '#52c41a' },
    { icon: <BellOutlined />, label: '工单中心', path: '/workorders', color: '#eb2f96' },
  ],
  owner: [
    { icon: <PlusOutlined />, label: '发布需求', path: '/demands/create', color: '#1890ff' },
    { icon: <EyeOutlined />, label: '查看合同', path: '/contracts', color: '#52c41a' },
    { icon: <VideoCameraOutlined />, label: '工地监控', path: '/supervision', color: '#fa8c16' },
    { icon: <ShopOutlined />, label: '云样板间', path: '/showroom', color: '#722ed1' },
    { icon: <BellOutlined />, label: '工单中心', path: '/workorders', color: '#eb2f96' },
    { icon: <BarChartOutlined />, label: '数据统计', path: '/dashboard', color: '#13c2c2' },
  ],
  designer: [
    { icon: <FileTextOutlined />, label: '需求列表', path: '/demands', color: '#1890ff' },
    { icon: <FileProtectOutlined />, label: '项目合同', path: '/contracts', color: '#52c41a' },
    { icon: <VideoCameraOutlined />, label: '工地监控', path: '/supervision', color: '#fa8c16' },
    { icon: <ShopOutlined />, label: '云样板间', path: '/showroom', color: '#722ed1' },
  ],
  supervisor: [
    { icon: <FileProtectOutlined />, label: '负责项目', path: '/contracts', color: '#1890ff' },
    { icon: <VideoCameraOutlined />, label: 'AI监理', path: '/supervision', color: '#52c41a' },
    { icon: <ToolOutlined />, label: '巡检记录', path: '/supervision', color: '#fa8c16' },
    { icon: <WarningOutlined />, label: '风险告警', path: '/supervision', color: '#eb2f96' },
  ],
  supplier: [
    { icon: <FileProtectOutlined />, label: '供货合同', path: '/contracts', color: '#1890ff' },
    { icon: <RiseOutlined />, label: '物流追踪', path: '/contracts', color: '#52c41a' },
    { icon: <CalendarOutlined />, label: '配送计划', path: '/contracts', color: '#fa8c16' },
    { icon: <BarChartOutlined />, label: '供货统计', path: '/dashboard', color: '#722ed1' },
  ],
  store_manager: [
    { icon: <FileTextOutlined />, label: '需求管理', path: '/demands', color: '#1890ff' },
    { icon: <FileProtectOutlined />, label: '合同管理', path: '/contracts', color: '#52c41a' },
    { icon: <VideoCameraOutlined />, label: 'AI监理', path: '/supervision', color: '#fa8c16' },
    { icon: <ShopOutlined />, label: '云样板间', path: '/showroom', color: '#722ed1' },
    { icon: <BellOutlined />, label: '工单管理', path: '/workorders', color: '#eb2f96' },
    { icon: <BarChartOutlined />, label: '管理后台', path: '/admin/dashboard', color: '#13c2c2' },
  ],
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<StatData>({
    demandCount: 0,
    contractCount: 0,
    todoCount: 0,
    riskCount: 0,
  });
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, progressRes] = await Promise.all([
        apiClient.get('/admin/dashboard/stats'),
        apiClient.get('/admin/dashboard/progress'),
      ]);
      setStats(statsRes.data);
      setProjectProgress(progressRes.data || []);
    } catch (error) {
      setStats({
        demandCount: 12,
        contractCount: 8,
        todoCount: 15,
        riskCount: 3,
      });
      setProjectProgress([
        {
          id: '1',
          name: '阳光花园1203室装修项目',
          status: '进行中',
          progress: 65,
          updateTime: new Date().toISOString(),
          operator: '李监理',
        },
        {
          id: '2',
          name: '翡翠湾8栋502室设计方案',
          status: '设计中',
          progress: 40,
          updateTime: new Date(Date.now() - 3600000).toISOString(),
          operator: '王设计',
        },
        {
          id: '3',
          name: '金色家园3栋1501室施工',
          status: '进行中',
          progress: 80,
          updateTime: new Date(Date.now() - 7200000).toISOString(),
          operator: '赵监理',
        },
        {
          id: '4',
          name: '碧水蓝天6栋203室材料配送',
          status: '待配送',
          progress: 20,
          updateTime: new Date(Date.now() - 86400000).toISOString(),
          operator: '孙供应商',
        },
        {
          id: '5',
          name: '锦绣花园1栋802室验收',
          status: '待验收',
          progress: 95,
          updateTime: new Date(Date.now() - 172800000).toISOString(),
          operator: '吴经理',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中':
        return 'processing';
      case '设计中':
        return 'blue';
      case '待配送':
        return 'orange';
      case '待验收':
        return 'purple';
      case '已完成':
        return 'success';
      default:
        return 'default';
    }
  };

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      textStyle: {
        color: '#333',
      },
    },
    legend: {
      data: ['需求数量', '合同数量', '项目完成率'],
      top: 0,
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left',
      },
      {
        type: 'value',
        name: '完成率(%)',
        position: 'right',
        max: 100,
      },
    ],
    series: [
      {
        name: '需求数量',
        type: 'line',
        smooth: true,
        data: [12, 19, 15, 22, 28, 35],
        itemStyle: {
          color: '#1890ff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '合同数量',
        type: 'line',
        smooth: true,
        data: [8, 12, 10, 18, 22, 28],
        itemStyle: {
          color: '#52c41a',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
            ],
          },
        },
      },
      {
        name: '项目完成率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [65, 70, 72, 78, 82, 88],
        itemStyle: {
          color: '#fa8c16',
        },
      },
    ],
  };

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    series: [
      {
        name: '项目状态分布',
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
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 35, name: '进行中', itemStyle: { color: '#1890ff' } },
          { value: 20, name: '设计中', itemStyle: { color: '#722ed1' } },
          { value: 15, name: '待配送', itemStyle: { color: '#fa8c16' } },
          { value: 10, name: '待验收', itemStyle: { color: '#13c2c2' } },
          { value: 25, name: '已完成', itemStyle: { color: '#52c41a' } },
        ],
      },
    ],
  };

  const statCards = [
    {
      title: '需求数',
      value: stats.demandCount,
      icon: <FileTextOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/demands',
    },
    {
      title: '合同数',
      value: stats.contractCount,
      icon: <FileProtectOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/contracts',
    },
    {
      title: '待办事项',
      value: stats.todoCount,
      icon: <CheckCircleOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/workorders',
    },
    {
      title: '风险告警',
      value: stats.riskCount,
      icon: <WarningOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: '/supervision',
    },
  ];

  const quickActions = user ? roleQuickActions[user.role] : [];

  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          欢迎回来，{user?.real_name}
        </Title>
        <Text type="secondary">
          {roleNames[user?.role as UserRole]} · 今天是 {dayjs().format('YYYY年MM月DD日 dddd')}
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              onClick={() => navigate(card.path)}
              style={{
                borderRadius: 12,
                border: 'none',
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  background: card.gradient,
                  padding: 24,
                  color: '#fff',
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{card.title}</Text>
                    <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>{card.value}</div>
                  </div>
                  <div style={{ opacity: 0.9 }}>{card.icon}</div>
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>点击查看详情 →</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="快捷操作"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 24 }}
          >
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} sm={8} md={6} key={index}>
                  <Button
                    type="text"
                    block
                    onClick={() => navigate(action.path)}
                    style={{
                      height: 90,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 8,
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        color: action.color,
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `${action.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {action.icon}
                    </div>
                    <Text style={{ fontSize: 13, color: '#333' }}>{action.label}</Text>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="项目状态分布"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <ReactECharts
              option={pieOption}
              style={{ height: 280 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="业务趋势"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 24 }}
          >
            <ReactECharts
              option={chartOption}
              style={{ height: 350 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="最近项目进展"
            extra={
              <Button type="link" onClick={() => navigate('/contracts')}>
                查看全部
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            {projectProgress.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={projectProgress}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/contracts/${item.id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />}>{item.operator.charAt(0)}</Avatar>}
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary">
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {dayjs(item.updateTime).format('YYYY-MM-DD HH:mm')}
                            </Text>
                            <Text type="secondary">操作人：{item.operator}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  height: 8,
                                  background: '#f0f0f0',
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    background: item.progress >= 80 ? '#52c41a' : item.progress >= 50 ? '#1890ff' : '#fa8c16',
                                    width: `${item.progress}%`,
                                    borderRadius: 4,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>
                            <Text strong style={{ minWidth: 50, textAlign: 'right' }}>
                              {item.progress}%
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无项目进展" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
