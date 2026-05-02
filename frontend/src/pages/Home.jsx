import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space } from 'antd';
import {
  FileTextOutlined,
  CheckSquareOutlined,
  BellOutlined,
  ArrowRightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi, todoApi, notificationApi } from '../api';
import { STATUS_NAMES, STATUS_COLORS, STEP_NAMES } from '../utils/constants';
import dayjs from 'dayjs';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    pendingOrders: 0,
    pendingTodos: 0,
    unreadNotifications: 0,
  });
  const [recentOrders, setRecentOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, todosRes, notifRes] = await Promise.allSettled([
          orderApi.getList({ limit: 10 }),
          todoApi.getCount(),
          notificationApi.getUnreadCount(),
        ]);

        let orders = [];
        let todos = { total: 0, pending: 0, completed: 0 };
        let notifCount = 0;

        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
          orders = ordersRes.value.data || [];
        }

        if (todosRes.status === 'fulfilled' && todosRes.value.success) {
          todos = todosRes.value.data || { total: 0, pending: 0, completed: 0 };
        }

        if (notifRes.status === 'fulfilled' && notifRes.value.success) {
          notifCount = notifRes.value.data?.count || 0;
        }

        const pendingCount = orders.filter(
          (o) => o.status === 'pending' || o.status === 'processing'
        ).length;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingCount,
          pendingTodos: todos.pending,
          unreadNotifications: notifCount,
        });
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('获取首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const orderColumns = [
    {
      title: '工单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '当前步骤',
      dataIndex: 'current_step',
      key: 'current_step',
      width: 100,
      render: (step) => STEP_NAMES[step] || step,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_NAMES[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/orders/${record.id}`)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">工作台</div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="page-card" hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="总工单数"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="page-card" hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="待处理工单"
              value={stats.pendingOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="page-card" hoverable onClick={() => navigate('/todos')}>
            <Statistic
              title="我的待办"
              value={stats.pendingTodos}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="page-card" hoverable onClick={() => navigate('/notifications')}>
            <Statistic
              title="未读通知"
              value={stats.unreadNotifications}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="page-card"
        title="最近工单"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/org-sync')}>
              新建工单
            </Button>
            <Button onClick={() => navigate('/orders')}>
              查看全部 <ArrowRightOutlined />
            </Button>
          </Space>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          loading={loading}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div>暂无工单数据</div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default Home;
