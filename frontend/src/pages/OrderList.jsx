import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Spin,
  Empty,
  Avatar,
  List,
  Tabs,
  Modal,
  message,
  Select,
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  StarOutlined,
  RightOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MessageOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderService } from '@/services/orderService';
import { useUserStore } from '@/stores/userStore';

const { Title, Text, Paragraph } = Typography;

const orderStatusMap = {
  pending: { label: '待支付', color: 'orange', icon: <ClockCircleOutlined /> },
  paid: { label: '已支付', color: 'blue', icon: <PayCircleOutlined /> },
  confirmed: { label: '已确认', color: 'cyan', icon: <CheckCircleOutlined /> },
  checked_in: { label: '已入住', color: 'green', icon: <HomeOutlined /> },
  checked_out: { label: '已退房', color: 'purple', icon: <CheckCircleOutlined /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
  refunded: { label: '已退款', color: 'error', icon: <ExclamationCircleOutlined /> },
};

function OrderList() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const statusTabs = [
    { key: 'all', label: '全部订单' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'confirmed', label: '已确认' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [activeTab, pagination.current, pagination.pageSize]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab === 'all' ? undefined : activeTab,
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const result = await orderService.getOrders(params);
      setOrders(result.orders || []);
      setPagination({
        ...pagination,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handlePay = (order) => {
    message.info('支付功能开发中...');
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      message.warning('请选择取消原因');
      return;
    }

    try {
      setActionLoading(true);
      await orderService.updateOrderStatus(selectedOrder.id, 'cancel', cancelReason);
      message.success('订单已取消');
      setCancelModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error('取消订单失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactLandlord = (order) => {
    message.info('消息功能开发中...');
  };

  const getStatusInfo = (status) => {
    return orderStatusMap[status] || { label: status, color: 'default', icon: <ClockCircleOutlined /> };
  };

  const renderOrderActions = (order) => {
    const actions = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          <Button
            key="pay"
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlePay(order);
            }}
          >
            去支付
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleCancelClick(order);
            }}
          >
            取消订单
          </Button>
        );
        break;

      case 'paid':
      case 'confirmed':
        actions.push(
          <Button
            key="contact"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleContactLandlord(order);
            }}
          >
            联系房东
          </Button>
        );
        break;

      case 'completed':
        if (!order.review) {
          actions.push(
            <Button
              key="review"
              type="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
            >
              去评价
            </Button>
          );
        }
        break;
    }

    actions.push(
      <Button
        key="detail"
        type="link"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleOrderClick(order.id);
        }}
      >
        订单详情 <RightOutlined />
      </Button>
    );

    return <Space>{actions}</Space>;
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        我的订单
      </Title>

      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={statusTabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
          }))}
        />
      </Card>

      <Spin spinning={loading}>
        {orders.length === 0 ? (
          <Card bordered={false}>
            <Empty
              description={
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    暂无相关订单
                  </Text>
                  <Button type="primary" onClick={() => navigate('/houses')}>
                    去看看房源
                  </Button>
                </div>
              }
              style={{ padding: '60px 0' }}
            />
          </Card>
        ) : (
          <List
            dataSource={orders}
            renderItem={(order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <List.Item
                  key={order.id}
                  style={{ cursor: 'pointer', padding: 0, marginBottom: 16 }}
                  onClick={() => handleOrderClick(order.id)}
                >
                  <Card bordered={false} hoverable>
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={8} md={6}>
                        <div
                          style={{
                            height: 140,
                            backgroundImage: `url(${order.house?.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 8,
                          }}
                        />
                      </Col>

                      <Col xs={24} sm={16} md={18}>
                        <Row justify="space-between" align="top" style={{ marginBottom: 8 }}>
                          <Col>
                            <Text strong style={{ fontSize: 16 }}>
                              {order.house?.title || order.orderNo}
                            </Text>
                          </Col>
                          <Col>
                            <Tag color={statusInfo.color}>
                              {statusInfo.icon} {statusInfo.label}
                            </Tag>
                          </Col>
                        </Row>

                        <Row gutter={[24, 8]} style={{ marginBottom: 12 }}>
                          <Col xs={12} sm={6}>
                            <Space>
                              <EnvironmentOutlined style={{ color: '#999' }} />
                              <Text type="secondary">{order.house?.city}</Text>
                            </Space>
                          </Col>
                          <Col xs={12} sm={8}>
                            <Space>
                              <CalendarOutlined style={{ color: '#999' }} />
                              <Text type="secondary">
                                {dayjs(order.checkInDate).format('MM-DD')} 至{' '}
                                {dayjs(order.checkOutDate).format('MM-DD')}
                              </Text>
                            </Space>
                          </Col>
                          <Col xs={12} sm={5}>
                            <Space>
                              <UserOutlined style={{ color: '#999' }} />
                              <Text type="secondary">{order.nights} 晚 · {order.guests} 人</Text>
                            </Space>
                          </Col>
                        </Row>

                        <Row justify="space-between" align="middle">
                          <Col>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              订单号：{order.orderNo}
                            </Text>
                          </Col>
                          <Col>
                            <Space align="center">
                              <Text type="secondary">合计：</Text>
                              <Text style={{ fontSize: 20, fontWeight: 600, color: '#ff4d4f' }}>
                                ¥{order.payableAmount || order.totalAmount || 0}
                              </Text>
                            </Space>
                          </Col>
                        </Row>

                        <Divider style={{ margin: '12px 0' }} />

                        <Row justify="space-between" align="middle">
                          <Col>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              创建时间：{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </Col>
                          <Col>
                            {renderOrderActions(order)}
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}

        {pagination.total > 0 && (
          <Card bordered={false} style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              共 {pagination.total} 条订单，第 {pagination.current} 页
            </Text>
          </Card>
        )}
      </Spin>

      <Modal
        title="取消订单"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalVisible(false)}>
            再想想
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={actionLoading}
            onClick={handleConfirmCancel}
          >
            确认取消
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>请选择取消原因：</Text>
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择取消原因"
          value={cancelReason || undefined}
          onChange={setCancelReason}
          options={[
            { label: '行程有变', value: '行程有变' },
            { label: '找到更合适的房源', value: '找到更合适的房源' },
            { label: '价格原因', value: '价格原因' },
            { label: '房东原因', value: '房东原因' },
            { label: '其他原因', value: '其他原因' },
          ]}
        />
      </Modal>
    </div>
  );
}

export default OrderList;