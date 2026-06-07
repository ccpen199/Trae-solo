import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

interface Category {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

interface ServiceSKU {
  id: number;
  name: string;
  price: number;
  duration?: number;
  category?: Category;
}

interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  customerAddress?: string;
  provider?: { name?: string };
  items?: Array<{ name?: string }>;
}

interface Stats {
  totalOrders: number;
  totalUsers: number;
  totalProviders: number;
  pendingOrders: number;
}

const statusText: Record<string, string> = {
  pending_dispatch: '待派单',
  dispatched: '已派单',
  accepted: '已接单',
  scheduled: '已预约',
  in_progress: '服务中',
  completed: '已完成',
  settled: '已结算',
  cancelled: '已取消',
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceSKU[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalUsers: 0,
    totalProviders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      setLoading(true);
      setError('');
      try {
        const [categoryRes, serviceRes, orderRes, statsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/services'),
          api.get('/orders'),
          api.get('/admin/stats'),
        ]);

        if (!mounted) return;
        setCategories(categoryRes.data?.categories || categoryRes.data?.data || []);
        setServices(serviceRes.data?.skus || serviceRes.data?.services || serviceRes.data?.data || []);
        setOrders(orderRes.data?.orders || orderRes.data?.data || []);
        setStats({
          totalOrders: Number(statsRes.data?.totalOrders || 0),
          totalUsers: Number(statsRes.data?.totalUsers || 0),
          totalProviders: Number(statsRes.data?.totalProviders || 0),
          pendingOrders: Number(statsRes.data?.pendingOrders || 0),
        });
      } catch (_err) {
        if (!mounted) return;
        setError('首页数据加载失败，请检查后端服务状态。');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      mounted = false;
    };
  }, []);

  const topServices = services.slice(0, 6);
  const recentOrders = orders.slice(0, 5);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 0 32px' }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Title level={3} style={{ margin: 0 }}>家庭生活服务平台</Title>
          <Text type="secondary">搜索筛选、订单提交、个人中心和后台管理一体化工作台</Text>
        </Col>
        <Col>
          <Space wrap>
            <Button icon={<ToolOutlined />} onClick={() => navigate('/services')}>搜索/筛选服务</Button>
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/orders')}>我的订单</Button>
            <Button type="primary" icon={<DashboardOutlined />} onClick={() => navigate('/admin')}>后台管理</Button>
          </Space>
        </Col>
      </Row>

      {error && <Alert type="warning" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="订单总数" value={stats.totalOrders} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="待派单" value={stats.pendingOrders} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="客户数" value={stats.totalUsers} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="服务商" value={stats.totalProviders} prefix={<ShopOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title="服务分类"
            extra={<Button type="link" onClick={() => navigate('/services')}>全部服务</Button>}
            loading={loading}
          >
            {categories.length === 0 ? (
              <Empty description="暂无分类" />
            ) : (
              <Space wrap>
                {categories.map((category) => (
                  <Tag color="blue" style={{ padding: '6px 10px', fontSize: 14 }}>
                    {category.icon ? `${category.icon} ` : <AppstoreOutlined />} {category.name}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="热门服务" loading={loading}>
            <List
              dataSource={topServices}
              locale={{ emptyText: '暂无服务项目' }}
              renderItem={(service) => (
                <List.Item
                  actions={[
                    <Button key="book" type="link" onClick={() => navigate('/services')}>立即预约</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={service.name}
                    description={`${service.category?.name || '家政服务'} · ${service.duration || 0} 分钟`}
                  />
                  <Text strong style={{ color: '#fa8c16' }}>¥{service.price}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title="最近订单"
            extra={<Button type="link" onClick={() => navigate('/orders')}>查看全部</Button>}
            loading={loading}
          >
            <List
              dataSource={recentOrders}
              locale={{ emptyText: '暂无订单记录' }}
              renderItem={(order) => (
                <List.Item
                  actions={[
                    <Button key="detail" type="link" onClick={() => navigate('/orders')}>查看详情</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={`${order.items?.[0]?.name || '服务订单'} · ${order.orderNo}`}
                    description={order.customerAddress || order.provider?.name || '本地演示订单'}
                  />
                  <Space>
                    <Tag>{statusText[order.status] || order.status}</Tag>
                    <Text strong>¥{order.totalAmount}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
