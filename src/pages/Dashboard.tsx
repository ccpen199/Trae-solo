import React from 'react';
import { Row, Col, Card, Statistic, Typography, List, Tag, Progress } from 'antd';
import {
  RiseOutlined,
  InboxOutlined,
  TruckOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  FileTextOutlined,
  CarOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  MonitorOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, selectUser, selectUserRole } from '../store/user';
import { formatMoney, formatRelativeTime } from '../utils/format';
import type { UserRole } from '../../shared/types';

const { Title, Text } = Typography;

interface StatCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  roles?: UserRole[];
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  iconClass: string;
  path: string;
}

const roleQuickActions: Record<UserRole, QuickAction[]> = {
  owner: [
    { label: '发布货源', icon: <InboxOutlined />, bgClass: 'bg-primary-50 hover:bg-primary-100', iconClass: 'text-primary-500', path: '/cargo/publish' },
    { label: '运价查询', icon: <SearchOutlined />, bgClass: 'bg-success-50 hover:bg-success-100', iconClass: 'text-success-500', path: '/price-query' },
    { label: '车辆管理', icon: <CarOutlined />, bgClass: 'bg-cyan-50 hover:bg-cyan-100', iconClass: 'text-cyan-500', path: '/capacity' },
    { label: '财务对账', icon: <DollarOutlined />, bgClass: 'bg-warning-50 hover:bg-warning-100', iconClass: 'text-warning-500', path: '/settlement' },
  ],
  fleet: [
    { label: '运单管理', icon: <FileTextOutlined />, bgClass: 'bg-primary-50 hover:bg-primary-100', iconClass: 'text-primary-500', path: '/waybills' },
    { label: '运力管理', icon: <CarOutlined />, bgClass: 'bg-success-50 hover:bg-success-100', iconClass: 'text-success-500', path: '/capacity' },
    { label: '财务对账', icon: <DollarOutlined />, bgClass: 'bg-cyan-50 hover:bg-cyan-100', iconClass: 'text-cyan-500', path: '/settlement' },
    { label: '结算中心', icon: <AuditOutlined />, bgClass: 'bg-warning-50 hover:bg-warning-100', iconClass: 'text-warning-500', path: '/bills' },
  ],
  driver: [
    { label: '运单管理', icon: <FileTextOutlined />, bgClass: 'bg-primary-50 hover:bg-primary-100', iconClass: 'text-primary-500', path: '/waybills' },
    { label: '轨迹追踪', icon: <EnvironmentOutlined />, bgClass: 'bg-success-50 hover:bg-success-100', iconClass: 'text-success-500', path: '/tracking' },
    { label: '认证中心', icon: <SafetyCertificateOutlined />, bgClass: 'bg-cyan-50 hover:bg-cyan-100', iconClass: 'text-cyan-500', path: '/auth' },
    { label: '财务对账', icon: <DollarOutlined />, bgClass: 'bg-warning-50 hover:bg-warning-100', iconClass: 'text-warning-500', path: '/bills' },
  ],
  operator: [
    { label: '订单管理', icon: <InboxOutlined />, bgClass: 'bg-primary-50 hover:bg-primary-100', iconClass: 'text-primary-500', path: '/orders' },
    { label: '在途监控', icon: <MonitorOutlined />, bgClass: 'bg-success-50 hover:bg-success-100', iconClass: 'text-success-500', path: '/tracking' },
    { label: '账单管理', icon: <DollarOutlined />, bgClass: 'bg-cyan-50 hover:bg-cyan-100', iconClass: 'text-cyan-500', path: '/bills' },
    { label: '运力管理', icon: <CarOutlined />, bgClass: 'bg-warning-50 hover:bg-warning-100', iconClass: 'text-warning-500', path: '/capacity' },
  ],
  admin: [
    { label: '订单管理', icon: <InboxOutlined />, bgClass: 'bg-primary-50 hover:bg-primary-100', iconClass: 'text-primary-500', path: '/orders' },
    { label: '在途监控', icon: <MonitorOutlined />, bgClass: 'bg-success-50 hover:bg-success-100', iconClass: 'text-success-500', path: '/tracking' },
    { label: '账单管理', icon: <DollarOutlined />, bgClass: 'bg-cyan-50 hover:bg-cyan-100', iconClass: 'text-cyan-500', path: '/bills' },
    { label: '运力管理', icon: <CarOutlined />, bgClass: 'bg-warning-50 hover:bg-warning-100', iconClass: 'text-warning-500', path: '/capacity' },
  ],
};

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'processing' | 'warning' | 'error';
  time: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(selectUser);
  const userRole = useUserStore(selectUserRole);

  const statCards: StatCardData[] = [
    {
      title: '今日订单',
      value: 128,
      icon: <InboxOutlined />,
      color: 'bg-primary-500',
      trend: 12.5,
      roles: ['owner', 'fleet', 'operator', 'admin'],
    },
    {
      title: '在途运单',
      value: 56,
      icon: <TruckOutlined />,
      color: 'bg-cyan-500',
      trend: 8.3,
      roles: ['owner', 'fleet', 'driver', 'operator', 'admin'],
    },
    {
      title: '本月收入',
      value: formatMoney(1256800),
      icon: <DollarOutlined />,
      color: 'bg-success-500',
      trend: 23.1,
      roles: ['owner', 'fleet', 'operator', 'admin'],
    },
    {
      title: '运力利用率',
      value: '86%',
      icon: <RiseOutlined />,
      color: 'bg-warning-500',
      trend: -2.4,
      roles: ['fleet', 'operator', 'admin'],
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      title: '订单 #ORD2024001 已完成',
      description: '上海 → 北京 10吨钢材运输',
      status: 'success',
      time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: '2',
      title: '运单 #WB2024002 正在运输中',
      description: '广州 → 深圳 5吨电子设备',
      status: 'processing',
      time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '3',
      title: '账单 #BL2024003 待确认',
      description: '金额 ¥12,500.00 待货主确认',
      status: 'warning',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: '4',
      title: '车辆 #VH001 年检即将到期',
      description: '请在 2024-02-15 前完成年检',
      status: 'error',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: '5',
      title: '新货主已注册',
      description: '张三 138****8888 完成注册',
      status: 'success',
      time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];

  const filteredStats = statCards.filter(
    (card) => !card.roles || (userRole && card.roles.includes(userRole))
  );

  const statusColors: Record<string, string> = {
    success: 'success',
    processing: 'processing',
    warning: 'warning',
    error: 'error',
  };

  const statusLabels: Record<string, string> = {
    success: '已完成',
    processing: '进行中',
    warning: '待处理',
    error: '异常',
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Title level={3} className="!mb-2">
          欢迎回来，{user?.username || '用户'}
        </Title>
        <Text className="text-gray-500">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
          {' · '}
          祝您工作愉快！
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {filteredStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card variant="borderless" className="card-shadow card-shadow-hover h-full">
              <div className="flex items-start justify-between">
                <div>
                  <Text className="text-gray-500 text-sm block mb-2">{stat.title}</Text>
                  <Statistic
                    value={stat.value}
                    className="!mb-2"
                    valueStyle={{ fontSize: '28px', fontWeight: 600 }}
                  />
                  {stat.trend !== undefined && (
                    <div className="flex items-center gap-1">
                      {stat.trend >= 0 ? (
                        <ArrowUpOutlined className="text-success-500" />
                      ) : (
                        <ArrowDownOutlined className="text-danger-500" />
                      )}
                      <Text
                        className={stat.trend >= 0 ? 'text-success-500' : 'text-danger-500'}
                        style={{ fontSize: '12px' }}
                      >
                        {Math.abs(stat.trend)}%
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {' '}较昨日
                      </Text>
                    </div>
                  )}
                </div>
                <div
                  className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近动态"
            variant="borderless"
            className="card-shadow"
            extra={<a onClick={() => navigate('/orders')}>查看全部</a>}
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <Text strong>{item.title}</Text>
                        <Tag color={statusColors[item.status]}>
                          {statusLabels[item.status]}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="flex items-center justify-between">
                        <Text type="secondary">{item.description}</Text>
                        <Text type="secondary" className="text-xs">
                          {formatRelativeTime(item.time)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="今日进度" variant="borderless" className="card-shadow">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>订单完成率</Text>
                  <Text strong>88%</Text>
                </div>
                <Progress percent={88} showInfo={false} strokeColor="#165DFF" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>车辆利用率</Text>
                  <Text strong>76%</Text>
                </div>
                <Progress percent={76} showInfo={false} strokeColor="#00B42A" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>准点送达率</Text>
                  <Text strong>95%</Text>
                </div>
                <Progress percent={95} showInfo={false} strokeColor="#14C9C9" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>客户满意度</Text>
                  <Text strong>92%</Text>
                </div>
                <Progress percent={92} showInfo={false} strokeColor="#FF7D00" />
              </div>
            </div>
          </Card>

          <Card title="快捷操作" variant="borderless" className="card-shadow mt-4">
            <div className="grid grid-cols-2 gap-3">
              {(userRole && roleQuickActions[userRole]
                ? roleQuickActions[userRole]
                : roleQuickActions.owner
              ).map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center p-4 ${action.bgClass} rounded-lg transition-colors`}
                >
                  <span className={`${action.iconClass} text-2xl mb-2`}>{action.icon}</span>
                  <Text className="text-sm text-gray-700">{action.label}</Text>
                </button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
