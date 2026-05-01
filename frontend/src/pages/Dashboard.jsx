import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Tag, message } from 'antd';
import {
  VideoCameraOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ShopOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store';
import { liveApi, orderApi, userApi } from '../api';
import dayjs from 'dayjs';

function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentLives, setRecentLives] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [livesResult, ordersResult] = await Promise.all([
        liveApi.getList('live', 10, 0),
        orderApi.getList(null, 10, 0)
      ]);

      if (livesResult.success) {
        setRecentLives(livesResult.data.list || []);
      }

      if (ordersResult.success) {
        setRecentOrders(ordersResult.data.list || []);
      }

      setStats({
          activeLives: livesResult.data?.total || 0,
          totalOrders: ordersResult.data?.list?.length || 0,
          totalRevenue: ordersResult.data?.list?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
        });

    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const liveColumns = [
    {
      title: '直播标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '主播',
      dataIndex: 'streamer_name',
      key: 'streamer_name',
    },
    {
      title: '观众数',
      dataIndex: 'viewer_count',
      key: 'viewer_count',
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        
        if (status === 'live') {
          color = 'red';
          text = '直播中';
        } else if (status === 'ended') {
          color = 'default';
          text = '已结束';
        } else if (status === 'pending') {
          color = 'orange';
          text = '待开始';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '商品',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        
        const statusMap = {
          pending_payment: { color: 'orange', text: '待支付' },
          paid: { color: 'blue', text: '已支付' },
          shipped: { color: 'purple', text: '已发货' },
          delivered: { color: 'green', text: '已完成' },
          cancelled: { color: 'default', text: '已取消' },
        };
        
        const mapped = statusMap[status] || { color: 'default', text: status };
        return <Tag color={mapped.color}>{mapped.text}</Tag>;
      },
    },
  ];

  const getRoleWelcome = () => {
    const welcomeMap = {
      platform_admin: '欢迎回来，平台管理员',
      streamer: '欢迎回来，主播',
      merchant: '欢迎回来，商家',
      viewer: '欢迎回来'
    };
    return welcomeMap[user?.role] || '欢迎回来';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>{getRoleWelcome()}，{user?.nickname || user?.username}</h2>
        <p style={{ color: '#666' }}>今天是 {dayjs().format('YYYY年MM月DD日')}</p>
      </div>

      <Row gutter={[24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
            title="正在直播"
            value={stats?.activeLives || 0}
            prefix={<VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="订单数量"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="总收入"
              value={stats?.totalRevenue || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="我的商品"
              value={0}
              prefix={<ShopOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title="热门直播间"
            extra={
              <Button 
                type="link" 
                onClick={() => window.location.hash = '#/lives'}
              >
                查看更多
              </Button>
            }
          >
            <Table
              columns={liveColumns}
              dataSource={recentLives}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="最近订单"
            extra={
              <Button 
                type="link" 
                onClick={() => window.location.hash = '#/orders'}
              >
                查看更多
              </Button>
            }
          >
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {user?.role === 'streamer' && (
        <Card style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>快捷操作</h3>
          <Row gutter={16}>
            <Col>
              <Button 
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => window.location.hash = '#/lives'}
            >
              创建直播间
            </Button>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
