import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Descriptions,
  Steps,
  Timeline,
  Modal,
  Form,
  Input,
  Rate,
  message,
  Select,
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  StarOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MessageOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HomeFilled,
  RightOutlined,
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

const statusFlow = ['pending', 'paid', 'confirmed', 'checked_in', 'checked_out', 'completed'];

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrderDetail(id);
      setOrder(result);
    } catch (error) {
      console.error('获取订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    return orderStatusMap[status] || { label: status, color: 'default', icon: <ClockCircleOutlined /> };
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const status = order.status;
    if (status === 'cancelled' || status === 'refunded') {
      return -1;
    }
    const index = statusFlow.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const handlePay = () => {
    message.info('支付功能开发中...');
  };

  const handleContactLandlord = () => {
    message.info('消息功能开发中...');
  };

  const handleCancelOrder = () => {
    Modal.confirm({
      title: '确认取消订单',
      content: '您确定要取消这个订单吗？',
      okText: '确认取消',
      cancelText: '再想想',
      okType: 'danger',
      onOk: async () => {
        try {
          setActionLoading(true);
          await orderService.updateOrderStatus(id, 'cancel', '用户主动取消');
          message.success('订单已取消');
          fetchOrderDetail();
        } catch (error) {
          console.error('取消订单失败:', error);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSubmitReview = async (values) => {
    try {
      setActionLoading(true);
      message.success('评价提交成功');
      setShowReviewModal(false);
      fetchOrderDetail();
    } catch (error) {
      console.error('提交评价失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderOrderActions = () => {
    if (!order) return null;
    const actions = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          <Button key="pay" type="primary" size="large" onClick={handlePay}>
            去支付
          </Button>
        );
        actions.push(
          <Button key="cancel" size="large" danger onClick={handleCancelOrder}>
            取消订单
          </Button>
        );
        break;

      case 'paid':
      case 'confirmed':
        actions.push(
          <Button key="contact" type="primary" size="large" onClick={handleContactLandlord}>
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
              size="large"
              onClick={() => setShowReviewModal(true)}
            >
              去评价
            </Button>
          );
        }
        break;
    }

    actions.push(
      <Button key="back" size="large" onClick={() => navigate('/orders')}>
        返回订单列表
      </Button>
    );

    return <Space size={16}>{actions}</Space>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="订单不存在" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>
          返回订单列表
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const currentStep = getCurrentStepIndex();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/orders')}
          style={{ marginBottom: 16 }}
        >
          返回订单列表
        </Button>
      </div>

      <Row gutter={[32, 24]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 24, padding: 24, background: '#fafafa', borderRadius: 8 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    {statusInfo.icon}
                    <Title level={3} style={{ margin: 0 }}>
                      {statusInfo.label}
                    </Title>
                  </Space>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    订单号：{order.orderNo}
                  </Text>
                </Col>
                <Col>
                  <Text style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                    ¥{order.payableAmount || order.totalAmount || 0}
                  </Text>
                </Col>
              </Row>
            </div>

            {currentStep >= 0 && (
              <div style={{ marginBottom: 24 }}>
                <Steps
                  current={currentStep}
                  items={[
                    { title: '待支付', description: order.status === 'pending' ? '等待支付' : '已完成' },
                    { title: '已支付', description: order.status === 'paid' ? '等待房东确认' : '已完成' },
                    { title: '已确认', description: order.status === 'confirmed' ? '等待入住' : '已完成' },
                    { title: '已入住', description: order.status === 'checked_in' ? '入住中' : '已完成' },
                    { title: '已退房', description: order.status === 'checked_out' ? '等待评价' : '已完成' },
                    { title: '已完成', description: '订单完成' },
                  ]}
                />
              </div>
            )}

            {(order.status === 'cancelled' || order.status === 'refunded') && (
              <div style={{ marginBottom: 24, padding: 24, background: '#fff1f0', borderRadius: 8 }}>
                <Space>
                  <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                  <div>
                    <Text strong>订单已取消</Text>
                    {order.cancelReason && (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        取消原因：{order.cancelReason}
                      </Text>
                    )}
                  </div>
                </Space>
              </div>
            )}
          </Card>

          <Card title="房源信息" bordered={false} style={{ marginBottom: 24 }}>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    height: 160,
                    backgroundImage: `url(${order.house?.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/houses/${order.houseId}`)}
                />
              </Col>
              <Col xs={24} sm={16}>
                <Title
                  level={4}
                  style={{ cursor: 'pointer', color: '#1890ff' }}
                  onClick={() => navigate(`/houses/${order.houseId}`)}
                >
                  {order.house?.title}
                </Title>
                <Row gutter={[24, 8]} style={{ marginTop: 16 }}>
                  <Col xs={12}>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#999' }} />
                      <Text type="secondary">
                        {order.house?.city} {order.house?.district}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={12}>
                    <Space>
                      <CalendarOutlined style={{ color: '#999' }} />
                      <Text type="secondary">
                        {dayjs(order.checkInDate).format('YYYY-MM-DD')} 至{' '}
                        {dayjs(order.checkOutDate).format('YYYY-MM-DD')}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={12}>
                    <Space>
                      <UserOutlined style={{ color: '#999' }} />
                      <Text type="secondary">
                        {order.nights} 晚 · {order.guests} 人
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={12}>
                    <Space>
                      <HomeOutlined style={{ color: '#999' }} />
                      <Text type="secondary">
                        {order.house?.bedrooms || 0} 间卧室 · {order.house?.bathrooms || 0} 间卫浴
                      </Text>
                    </Space>
                  </Col>
                </Row>
                <Button
                  type="link"
                  onClick={() => navigate(`/houses/${order.houseId}`)}
                  style={{ marginTop: 16, paddingLeft: 0 }}
                >
                  查看房源详情 <RightOutlined />
                </Button>
              </Col>
            </Row>
          </Card>

          <Card title="费用明细" bordered={false} style={{ marginBottom: 24 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text type="secondary">房费</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text>
                  ¥{order.pricePerNight} × {order.nights} 晚
                </Text>
                <Text strong> = ¥{order.pricePerNight * order.nights}</Text>
              </Col>

              {order.cleaningFee > 0 && (
                <>
                  <Col span={12}>
                    <Text type="secondary">清洁费</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text>¥{order.cleaningFee}</Text>
                  </Col>
                </>
              )}

              {order.securityDeposit > 0 && (
                <>
                  <Col span={12}>
                    <Text type="secondary">押金</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text>¥{order.securityDeposit}</Text>
                  </Col>
                </>
              )}

              {order.discountAmount > 0 && (
                <>
                  <Col span={12}>
                    <Text type="secondary">优惠</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text style={{ color: '#52c41a' }}>-¥{order.discountAmount}</Text>
                  </Col>
                </>
              )}

              <Divider />

              <Col span={12}>
                <Text strong style={{ fontSize: 16 }}>
                  合计
                </Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: 20, color: '#ff4d4f' }}>
                  ¥{order.payableAmount || order.totalAmount || 0}
                </Text>
              </Col>
            </Row>
          </Card>

          {order.review && (
            <Card title="我的评价" bordered={false} style={{ marginBottom: 24 }}>
              <div>
                <Row align="middle" style={{ marginBottom: 12 }}>
                  <Text strong style={{ marginRight: 16 }}>评分</Text>
                  <Rate disabled defaultValue={order.review.rating} />
                </Row>
                <Paragraph>{order.review.content}</Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  评价时间：{dayjs(order.review.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </Card>
          )}

          {order.specialRequests && (
            <Card title="特殊要求" bordered={false} style={{ marginBottom: 24 }}>
              <Paragraph>{order.specialRequests}</Paragraph>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              position: 'sticky',
              top: 24,
            }}
          >
            <Title level={4} style={{ marginBottom: 24 }}>
              房东信息
            </Title>

            {order.house?.landlord && (
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[16, 8]} align="middle">
                  <Col>
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      src={order.house.landlord.avatar}
                      style={{ backgroundColor: '#ff4d4f' }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ fontSize: 16 }}>
                      {order.house.landlord.nickname}
                    </Text>
                    {order.house.landlord.isVerified && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        已认证
                      </Tag>
                    )}
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      房东
                    </Text>
                  </Col>
                </Row>
              </div>
            )}

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              订单信息
            </Title>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {order.paidAt && (
                <Descriptions.Item label="支付时间">
                  {dayjs(order.paidAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {order.checkInTime && (
                <Descriptions.Item label="实际入住">
                  {dayjs(order.checkInTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {order.checkOutTime && (
                <Descriptions.Item label="实际退房">
                  {dayjs(order.checkOutTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {order.transactionId && (
                <Descriptions.Item label="交易号">{order.transactionId}</Descriptions.Item>
              )}
              {order.guestNames && order.guestNames.length > 0 && (
                <Descriptions.Item label="入住客人">
                  {order.guestNames.join(', ')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <div style={{ textAlign: 'center' }}>{renderOrderActions()}</div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="发表评价"
        open={showReviewModal}
        onCancel={() => setShowReviewModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleSubmitReview}
        >
          <Form.Item
            label="评分"
            name="rating"
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            label="评价内容"
            name="content"
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="分享您的入住体验，帮助其他房客做出更好的选择..."
            />
          </Form.Item>

          <Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Button
                  block
                  onClick={() => setShowReviewModal(false)}
                >
                  取消
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={actionLoading}
                >
                  提交评价
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderDetail;