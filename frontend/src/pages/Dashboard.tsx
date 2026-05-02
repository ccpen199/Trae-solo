import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingOutlined,
  OrderFormOutlined,
  WarningOutlined,
  TodoListOutlined,
  DownloadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { dashboardApi, exportApi } from '../services/api';
import { DashboardStats, TrendData, Order, Exception } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data.data as DashboardStats;
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboardTrend'],
    queryFn: async () => {
      const response = await dashboardApi.getTrend();
      return response.data.data as TrendData[];
    },
  });

  const handleExport = async (type: 'accounts' | 'orders' | 'exceptions') => {
    try {
      const response = await exportApi[type]({ format: 'csv' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${type}_${dayjs().format('YYYYMMDD')}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '账号名称',
      dataIndex: ['account', 'title'],
      key: 'accountTitle',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => <strong>¥{price}</strong>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING_PAYMENT: 'orange',
          PENDING_DELIVERY: 'blue',
          PENDING_CONFIRM: 'cyan',
          COMPLETED: 'green',
          CANCELED: 'default',
          EXCEPTION: 'red',
        };
        const statusText: Record<string, string> = {
          PENDING_PAYMENT: '待支付',
          PENDING_DELIVERY: '待发货',
          PENDING_CONFIRM: '待确认',
          COMPLETED: '已完成',
          CANCELED: '已取消',
          EXCEPTION: '异常',
        };
        return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const exceptionColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeText: Record<string, string> = {
          PAYMENT_ISSUE: '支付问题',
          DELIVERY_ISSUE: '发货问题',
          ACCOUNT_ISSUE: '账号问题',
          COMPLAINT: '投诉',
          REFUND_REQUEST: '退款申请',
          OTHER: '其他',
        };
        return typeText[type] || type;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          LOW: 'default',
          MEDIUM: 'orange',
          HIGH: 'red',
          URGENT: 'magenta',
        };
        const priorityText: Record<string, string> = {
          LOW: '低',
          MEDIUM: '中',
          HIGH: '高',
          URGENT: '紧急',
        };
        return <Tag color={colorMap[priority]}>{priorityText[priority]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          PROCESSING: 'processing',
          RESOLVED: 'success',
          CLOSED: 'default',
        };
        const statusText: Record<string, string> = {
          PENDING: '待处理',
          PROCESSING: '处理中',
          RESOLVED: '已解决',
          CLOSED: '已关闭',
        };
        return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-stat" loading={statsLoading}>
            <Statistic
              title="总账号数"
              value={statsData?.overview.totalAccounts || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-stat" loading={statsLoading}>
            <Statistic
              title="总订单数"
              value={statsData?.overview.totalOrders || 0}
              prefix={<OrderFormOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-stat" loading={statsLoading}>
            <Statistic
              title="待处理异常"
              value={statsData?.overview.pendingExceptions || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-stat" loading={statsLoading}>
            <Statistic
              title="待办事项"
              value={statsData?.overview.pendingTodos || 0}
              prefix={<TodoListOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="订单趋势"
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport('orders')}
                  size="small"
                >
                  导出订单
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport('accounts')}
                  size="small"
                >
                  导出账号
                </Button>
              </Space>
            }
          >
            <div style={{ height: 300 }}>
              {!trendLoading && trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#1890ff" name="创建订单" />
                    <Line type="monotone" dataKey="completed" stroke="#52c41a" name="完成订单" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', lineHeight: '300px', color: '#999' }}>
                  暂无数据
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="交易金额统计" className="card-stat">
            <Statistic
              title="总交易额"
              value={statsData?.overview.totalAmount || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="最近订单"
            style={{ marginBottom: 24 }}
            extra={<a href="/orders">查看全部 →</a>}
          >
            <Table
              columns={orderColumns}
              dataSource={statsData?.recentOrders || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="最近异常"
            extra={
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport('exceptions')}
                  size="small"
                >
                  导出异常
                </Button>
                <a href="/exceptions">查看全部 →</a>
              </Space>
            }
          >
            <Table
              columns={exceptionColumns}
              dataSource={statsData?.recentExceptions || []}
              rowKey="id"
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
