import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Button, Empty, Spin, Tag, Typography, Space, Menu } from 'antd';
import { BookOutlined, UserOutlined, UnorderedListOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getOrders } from '../api/order';
import { getUser } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Orders = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async (status) => {
    setLoading(true);
    try {
      const res = await getOrders(status);
      setOrders(res.data || []);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleTabChange = (key) => {
    loadOrders(key === 'all' ? undefined : key);
  };

  const handleOrderClick = (id) => {
    navigate(`/order/${id}`);
  };

  const statusMap = {
    ongoing: { text: '进行中', color: 'blue' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' }
  };

  const items = [
    {
      key: 'all',
      label: '全部'
    },
    {
      key: 'ongoing',
      label: '进行中'
    },
    {
      key: 'completed',
      label: '已完成'
    },
    {
      key: 'cancelled',
      label: '已取消'
    }
  ];

  return (
    <div className="page-container page-content">
      <div className="page-header">
        <div className="page-title">我的订单</div>
      </div>

      <Tabs defaultActiveKey="all" items={items} onChange={handleTabChange}>
        <div className="tab-container">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <Empty
              description="暂无订单"
              className="empty-state"
            />
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="card-item"
                onClick={() => handleOrderClick(order.id)}
                hoverable
              >
                <div className="flex-between">
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{order.subject}</Title>
                    <Text type="secondary">
                      {user.role === 'student' 
                        ? `老师: ${order.teacher_name || '未填写'}`
                        : `学生: ${order.student_name || '未填写'}`
                      }
                    </Text>
                  </div>
                  <Tag color={statusMap[order.status]?.color}>
                    {statusMap[order.status]?.text}
                  </Tag>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary"><EnvironmentOutlined /> {order.location}</Text>
                    <Text type="secondary"><ClockCircleOutlined /> {order.class_time}</Text>
                    <Text type="secondary">创建时间: {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                  </Space>
                </div>
              </Card>
            ))
          )}
        </div>
      </Tabs>

      <div className="bottom-nav">
        <Menu
          mode="horizontal"
          selectedKeys={['orders']}
          onClick={({ key }) => navigate(key === 'home' ? '/' : `/${key}`)}
        >
          <Menu.Item key="home" icon={<BookOutlined />}>首页</Menu.Item>
          <Menu.Item key="orders" icon={<UnorderedListOutlined />}>订单</Menu.Item>
          <Menu.Item key="profile" icon={<UserOutlined />}>我的</Menu.Item>
        </Menu>
      </div>
    </div>
  );
};

export default Orders;
