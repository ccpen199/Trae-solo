import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Tabs,
  Empty,
  Spin,
  Pagination,
  message,
  Avatar,
  Badge,
  Dropdown
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  StarOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api/index.js';
import { isCouple } from '../../utils/auth.js';

const { Title, Text } = Typography;

const ORDER_STATUS = {
  all: { label: '全部', color: 'default', icon: null },
  pending: { label: '待付款', color: 'orange', icon: <ClockCircleOutlined /> },
  paid: { label: '已付款', color: 'blue', icon: <DollarOutlined /> },
  confirmed: { label: '已确认', color: 'cyan', icon: <CheckCircleOutlined /> },
  in_progress: { label: '服务中', color: 'purple', icon: <CalendarOutlined /> },
  completed: { label: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  cancelled: { label: '已取消', color: 'default', icon: <ExclamationCircleOutlined /> },
  refunded: { label: '已退款', color: 'default', icon: <DollarOutlined /> }
};

const OrderList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    fetchOrders(1, activeTab);
  }, [activeTab]);

  const fetchOrders = async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize,
        ...(status !== 'all' && { status })
      };
      const response = await orderAPI.list(params);
      setOrders(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total || 0
      }));
      setStatusCounts(response.data.status_counts || {});
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchOrders(page, activeTab);
  };

  const handleUpdateStatus = async (orderId, newStatus, label) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      message.success(`${label}成功`);
      fetchOrders(pagination.current, activeTab);
    } catch (error) {
      message.error(`${label}失败`);
    }
  };

  const getStatusConfig = (status) => {
    return ORDER_STATUS[status] || ORDER_STATUS.all;
  };

  const getActionMenu = (order) => {
    const items = [];

    if (isCouple()) {
      if (order.status === 'pending') {
        items.push({
          key: 'pay',
          label: '立即付款',
          onClick: () => handleUpdateStatus(order.id, 'paid', '付款')
        });
      }
      if (order.status === 'paid') {
        items.push({
          key: 'confirm',
          label: '确认订单',
          onClick: () => handleUpdateStatus(order.id, 'confirmed', '确认')
        });
      }
      if (order.status === 'in_progress') {
        items.push({
          key: 'complete',
          label: '确认完成',
          onClick: () => handleUpdateStatus(order.id, 'completed', '确认完成')
        });
      }
      if (order.status === 'completed' && !order.reviewed) {
        items.push({
          key: 'review',
          label: '去评价',
          onClick: () => navigate(`/orders/${order.id}?tab=review`)
        });
      }
      if (order.status === 'pending') {
        items.push({
          key: 'cancel',
          label: '取消订单',
          danger: true,
          onClick: () => handleUpdateStatus(order.id, 'cancelled', '取消')
        });
      }
    } else {
      if (order.status === 'paid') {
        items.push({
          key: 'confirm',
          label: '确认接单',
          onClick: () => handleUpdateStatus(order.id, 'confirmed', '确认接单')
        });
      }
      if (order.status === 'confirmed') {
        items.push({
          key: 'start',
          label: '开始服务',
          onClick: () => handleUpdateStatus(order.id, 'in_progress', '开始服务')
        });
      }
      if (order.status === 'in_progress') {
        items.push({
          key: 'complete',
          label: '标记完成',
          onClick: () => handleUpdateStatus(order.id, 'completed', '标记完成')
        });
      }
    }

    return items.length > 0 ? { items } : null;
  };

  const renderOrderCard = (order) => {
    const statusConfig = getStatusConfig(order.status);
    const menu = getActionMenu(order);

    return (
      <Card
        key={order.id}
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
        hoverable
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={16}>
                <Text type="secondary">
                  订单号：<Text copyable strong style={{ color: '#333' }}>{order.order_no}</Text>
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined /> {order.created_at}
                </Text>
              </Space>
            </Col>
            <Col>
              <Tag
                color={statusConfig.color}
                icon={statusConfig.icon}
                style={{ fontSize: 13, padding: '2px 12px', margin: 0 }}
              >
                {statusConfig.label}
              </Tag>
            </Col>
          </Row>
        </div>

        <Row gutter={0} style={{ padding: '20px' }} onClick={() => navigate(`/orders/${order.id}`)}>
          <Col xs={24} sm={6} style={{ paddingRight: 16 }}>
            <div
              style={{
                width: '100%',
                paddingTop: '75%',
                backgroundImage: `url(${order.service_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(order.service_category || 'service')}&image_size=square`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            />
          </Col>
          <Col xs={24} sm={12} style={{ padding: '0 16px' }}>
            <Title level={4} style={{ marginBottom: 8, fontSize: 18, cursor: 'pointer' }}>
              {order.service_name}
            </Title>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              <Tag icon={<ShopOutlined />} size="small">
                {order.company_name}
              </Tag>
              {order.service_category_name && (
                <Tag color="blue" size="small">
                  {order.service_category_name}
                </Tag>
              )}
              {order.reviewed && (
                <Tag color="green" icon={<StarOutlined />} size="small">
                  已评价
                </Tag>
              )}
            </Space>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {order.service_date && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  服务日期：{order.service_date}
                  {order.service_time && ` ${order.service_time}`}
                </Text>
              )}
              {order.address && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  服务地点：{order.address}
                </Text>
              )}
              {order.remark && (
                <Text type="secondary" style={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  备注：{order.remark}
                </Text>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={6} style={{ paddingLeft: 16, textAlign: 'right' }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>订单金额</Text>
              <div style={{ color: '#ff4d6d', fontSize: 24, fontWeight: 'bold' }}>
                ¥{order.total_amount?.toLocaleString()}
              </div>
              {order.paid_amount !== undefined && order.paid_amount > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  已付：¥{order.paid_amount?.toLocaleString()}
                </Text>
              )}
            </div>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                block
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${order.id}`);
                }}
              >
                查看详情
              </Button>
              {menu && (
                <Dropdown menu={menu} trigger={['click']}>
                  <Button block onClick={(e) => e.stopPropagation()}>
                    <Space>
                      更多操作
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>
              )}
            </Space>
          </Col>
        </Row>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fafafa', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={24}>
                <Avatar size={32} src={order.merchant_logo}>
                  {order.company_name?.[0]}
                </Avatar>
                <div>
                  <Text strong>{order.company_name}</Text>
                  <div style={{ marginTop: 2 }}>
                    <Button type="link" size="small" icon={<MessageOutlined />} style={{ padding: 0, height: 'auto' }}>
                      联系商家
                    </Button>
                  </div>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size={12}>
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order.id}?tab=review`);
                  }}
                >
                  评价
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  const tabItems = Object.entries(ORDER_STATUS).map(([key, config]) => ({
    key,
    label: (
      <Space>
        {config.icon}
        <span>{config.label}</span>
        {statusCounts[key] !== undefined && statusCounts[key] > 0 && (
          <Badge count={statusCounts[key]} size="small" style={{ marginLeft: 4 }} />
        )}
      </Space>
    )
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          我的订单
        </Title>
        <Text type="secondary">
          查看和管理您的所有订单
        </Text>
      </div>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
          size="large"
        />

        <Spin spinning={loading}>
          {orders.length > 0 ? (
            <>
              <div style={{ padding: '0 24px 24px' }}>
                {orders.map(order => renderOrderCard(order))}
                {pagination.total > pagination.pageSize && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total) => `共 ${total} 个订单`}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            !loading && (
              <Empty
                description={`暂无${ORDER_STATUS[activeTab]?.label || ''}订单`}
                style={{ padding: '80px 0' }}
              >
                <Button type="primary" onClick={() => navigate('/services')}>
                  去看看服务
                </Button>
              </Empty>
            )
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default OrderList;
