import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Tag, Space, Button, Tabs, Empty, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { ordersAPI } from '../api';
import dayjs from 'dayjs';

function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.list({ status: activeTab });
      setOrders(res.orders || []);
    } catch (err) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status, refundStatus) => {
    if (status === 'refunded') return <Tag color="orange">已退款</Tag>;
    if (status === 'paid') return <Tag color="green">已支付</Tag>;
    if (status === 'pending') return <Tag color="blue">待支付</Tag>;
    if (status === 'cancelled') return <Tag color="gray">已取消</Tag>;
    return <Tag>{status}</Tag>;
  };

  const items = [
    { key: 'all', label: '全部订单' },
    { key: 'paid', label: '已支付' },
    { key: 'pending', label: '待支付' },
    { key: 'refunded', label: '已退款' }
  ];

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <Card title="我的订单">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        
        <List
          loading={loading}
          dataSource={orders}
          locale={{ emptyText: <Empty description="暂无订单" /> }}
          renderItem={(order) => (
            <List.Item
              style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
              actions={[
                <Button type="link" onClick={() => navigate(`/orders/${order.id}`)}>
                  查看详情 <RightOutlined />
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #1890ff, #722ed1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28 }}>
                    🎫
                  </div>
                }
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{order.title}</span>
                    {getStatusTag(order.status, order.refund_status)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                    <Space size="small" style={{ color: '#666' }}>
                      <CalendarOutlined />
                      <span>{dayjs(order.start_time).format('YYYY-MM-DD HH:mm')}</span>
                    </Space>
                    <Space size="small" style={{ color: '#666' }}>
                      <EnvironmentOutlined />
                      <span>{order.venue}</span>
                    </Space>
                    <Space size="small" style={{ color: '#999', fontSize: 12 }}>
                      <span>订单号：{order.order_no}</span>
                      <span>|</span>
                      <span>金额：¥{order.pay_amount}</span>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default OrderList;
