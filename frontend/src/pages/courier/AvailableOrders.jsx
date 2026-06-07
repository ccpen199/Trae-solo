import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Empty, Spin, Select, Row, Col, Typography, message } from 'antd';
import { EnvironmentOutlined, ThunderboltOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api';

const { Text, Paragraph } = Typography;

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

export default function AvailableOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [accepting, setAccepting] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await orderAPI.getAvailable(params);
      const data = res.data || res;
      setOrders(data.orders || data.list || data.items || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [typeFilter]);

  const handleAccept = async (orderId) => {
    setAccepting(orderId);
    try {
      await orderAPI.accept(orderId);
      message.success('接单成功！');
      fetchOrders();
      navigate('/courier/tasks');
    } catch {
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div>
      <Card
        title="待接订单"
        extra={
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部类型' },
              { value: 'pickup_delivery', label: '帮取送' },
              { value: 'purchase', label: '帮买' },
              { value: 'allpurpose', label: '全能帮' },
              { value: 'queue', label: '帮排队' },
            ]}
          />
        }
      >
        <Spin spinning={loading}>
          {orders.length === 0 && !loading ? (
            <Empty description="暂无可接订单" />
          ) : (
            <Row gutter={[16, 16]}>
              {orders.map((order) => (
                <Col xs={24} sm={12} lg={8} key={order.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={accepting === order.id}
                        onClick={() => handleAccept(order.id)}
                      >
                        快速接单
                      </Button>,
                    ]}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={typeMap[order.type]?.color || 'default'}>
                        {typeMap[order.type]?.text || order.type}
                      </Tag>
                      {Number(order.priority) > 0 && (
                        <Tag color={Number(order.priority) === 2 ? 'red' : 'orange'}>
                          {Number(order.priority) === 2 ? '特急' : '加急'}
                        </Tag>
                      )}
                    </div>

                    <Paragraph ellipsis={{ rows: 1 }} strong>
                      {order.title}
                    </Paragraph>

                    <div style={{ marginBottom: 4 }}>
                      <EnvironmentOutlined style={{ marginRight: 4, color: '#999' }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {order.pickup_address || order.queue_location || '待确认'}
                      </Text>
                    </div>

                    {order.delivery_address && (
                      <div style={{ marginBottom: 4 }}>
                        <RightOutlined style={{ marginRight: 4, color: '#999', fontSize: 10 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>{order.delivery_address}</Text>
                      </div>
                    )}

                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="warning" strong style={{ fontSize: 16 }}>¥{order.fee}</Text>
                      {order.reward > 0 && (
                        <Tag color="red">+¥{order.reward} 奖励</Tag>
                      )}
                    </div>

                    {order.distance && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        距离: {order.distance}km
                      </Text>
                    )}

                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        截止: {order.deadline ? dayjs(order.deadline).format('HH:mm') : '-'}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </div>
  );
}
