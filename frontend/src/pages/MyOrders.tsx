import React, { useState, useEffect } from 'react';
import { Card, Tabs, List, Tag, Button, Avatar, Empty, Space } from 'antd';
import { UserOutlined, CarOutlined, CarryOutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import type { LaborOrder, DeliveryOrder, MovingOrder } from '../types';

function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('labor');
  const [laborOrders, setLaborOrders] = useState<LaborOrder[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [movingOrders, setMovingOrders] = useState<MovingOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeKey === 'labor') fetchLaborOrders();
    if (activeKey === 'delivery') fetchDeliveryOrders();
    if (activeKey === 'moving') fetchMovingOrders();
  }, [activeKey, user]);

  const fetchLaborOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (user.role === 'employer') params.employer_id = user.id;
      if (user.role === 'worker') params.worker_id = user.id;
      const data: any = await api.get('/labor-orders', { params });
      setLaborOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch labor orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (user.role === 'employer') params.employer_id = user.id;
      if (user.role === 'driver') params.driver_id = user.id;
      const data: any = await api.get('/delivery-orders', { params });
      setDeliveryOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovingOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: any = { limit: 50, employer_id: user.id };
      const data: any = await api.get('/moving-orders', { params });
      setMovingOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch moving orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string, type: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待接单', color: 'orange' },
      bidding: { text: '竞价中', color: 'magenta' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
      split: { text: '已拆单', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const renderLaborOrders = () => (
    <List
      loading={loading}
      dataSource={laborOrders}
      locale={{ emptyText: <Empty description="暂无用工订单" /> }}
      renderItem={(order) => {
        const statusInfo = getStatusText(order.status, 'labor');
        return (
          <List.Item 
            style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
            onClick={() => navigate(`/labor/${order.id}`)}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} size={40} />}
              title={
                <Space>
                  <span style={{ fontWeight: 500 }}>{order.title}</span>
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                    {order.city} {order.address}
                  </div>
                  <div style={{ color: '#fa8c16', fontWeight: 600 }}>¥{order.total_price}</div>
                </div>
              }
            />
            <Button size="small">查看</Button>
          </List.Item>
        );
      }}
    />
  );

  const renderDeliveryOrders = () => (
    <List
      loading={loading}
      dataSource={deliveryOrders}
      locale={{ emptyText: <Empty description="暂无找车订单" /> }}
      renderItem={(order) => {
        const statusInfo = getStatusText(order.status, 'delivery');
        return (
          <List.Item 
            style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
            onClick={() => navigate(`/delivery/${order.id}`)}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<CarOutlined />} size={40} style={{ background: '#52c41a' }} />}
              title={
                <Space>
                  <span style={{ fontWeight: 500 }}>{order.title}</span>
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                    {order.pickup_address} → {order.delivery_address}
                  </div>
                  <div style={{ color: '#fa8c16', fontWeight: 600 }}>
                    {order.status === 'bidding' ? `起拍 ¥${order.bid_start_price}` : `¥${order.final_price}`}
                  </div>
                </div>
              }
            />
            <Button size="small">查看</Button>
          </List.Item>
        );
      }}
    />
  );

  const renderMovingOrders = () => (
    <List
      loading={loading}
      dataSource={movingOrders}
      locale={{ emptyText: <Empty description="暂无搬家订单" /> }}
      renderItem={(order) => {
        const statusInfo = getStatusText(order.status, 'moving');
        return (
          <List.Item 
            style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
            onClick={() => navigate(`/moving/${order.id}`)}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<CarryOutOutlined />} size={40} style={{ background: '#fa8c16' }} />}
              title={
                <Space>
                  <span style={{ fontWeight: 500 }}>{order.title}</span>
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                    {order.from_address} → {order.to_address}
                  </div>
                  <div style={{ color: '#fa8c16', fontWeight: 600 }}>¥{order.total_price}</div>
                </div>
              }
            />
            <Button size="small">查看</Button>
          </List.Item>
        );
      }}
    />
  );

  const tabItems = [
    { key: 'labor', label: '用工订单', children: renderLaborOrders() },
    { key: 'delivery', label: '找车订单', children: renderDeliveryOrders() },
    { key: 'moving', label: '搬家订单', children: renderMovingOrders() },
  ];

  return (
    <div className="page-container">
      <Card title="我的订单" style={{ marginBottom: 16 }} />
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
    </div>
  );
}

export default MyOrders;
