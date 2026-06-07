import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Empty, Spin, Pagination, Row, Col, Typography, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api';

const { Text, Paragraph } = Typography;

const statusMap = {
  pending: { text: '待接单', color: 'orange' },
  dispatched: { text: '已调度', color: 'blue' },
  accepted: { text: '已接单', color: 'cyan' },
  arrived: { text: '已上门', color: 'geekblue' },
  in_progress: { text: '进行中', color: 'processing' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
  timeout: { text: '超时', color: 'volcano' },
};

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, total: 0, pageSize: 10 });
  const navigate = useNavigate();

  const fetchOrders = async (page = 1, status = activeTab) => {
    setLoading(true);
    try {
      const params = { page, pageSize: pagination.pageSize };
      if (status !== 'all') params.status = status;
      const res = await orderAPI.getList(params);
      const data = res.data || res;
      setOrders(data.orders || data.list || data.items || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: data.total || 0,
      }));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    fetchOrders(1, key);
  };

  return (
    <div>
      <Card title="我的订单">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />

        <Spin spinning={loading}>
          {orders.length === 0 && !loading ? (
            <Empty description="暂无订单" />
          ) : (
            <Row gutter={[16, 16]}>
              {orders.map((order) => (
                <Col xs={24} sm={12} lg={8} key={order.id || order.order_no}>
                  <Card
                    size="small"
                    hoverable
                    extra={
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/requester/orders/${order.id}`)}
                      >
                        查看
                      </Button>
                    }
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={typeMap[order.type]?.color || 'default'}>
                        {typeMap[order.type]?.text || order.type}
                      </Tag>
                      <Tag color={statusMap[order.status]?.color || 'default'}>
                        {statusMap[order.status]?.text || order.status}
                      </Tag>
                    </div>
                    <Paragraph ellipsis={{ rows: 1 }} strong style={{ marginBottom: 4 }}>
                      {order.title}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      订单号: {order.order_no}
                    </Text>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="warning" strong>¥{order.fee}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(order.created_at).format('MM-DD HH:mm')}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {pagination.total > pagination.pageSize && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={(page) => fetchOrders(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
}
