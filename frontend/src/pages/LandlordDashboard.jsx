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
  List,
  Avatar,
  Tabs,
  Statistic,
  Descriptions,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Timeline,
} from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  StarOutlined,
  EnvironmentOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/userStore';
import { houseService } from '@/services/houseService';
import { orderService } from '@/services/orderService';
import { userService } from '@/services/userService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const houseTypes = [
  { label: '公寓', value: 'apartment' },
  { label: '住宅', value: 'house' },
  { label: '别墅', value: 'villa' },
  { label: 'LOFT', value: 'loft' },
  { label: '单间', value: 'studio' },
];

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '三亚', '南京',
  '武汉', '西安', '重庆', '厦门', '苏州', '青岛', '大连', '天津'
];

const amenities = [
  { label: 'WiFi', value: 'wifi' },
  { label: '免费停车', value: 'parking' },
  { label: '厨房', value: 'kitchen' },
  { label: '洗衣机', value: 'washing_machine' },
  { label: '空调', value: 'air_conditioner' },
  { label: '暖气', value: 'heater' },
  { label: '电视', value: 'tv' },
  { label: '冰箱', value: 'refrigerator' },
  { label: '阳台', value: 'balcony' },
  { label: '泳池', value: 'swimming_pool' },
  { label: '允许吸烟', value: 'smoking_allowed' },
  { label: '允许携带宠物', value: 'pet_allowed' },
];

function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [myHouses, setMyHouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showCreateHouseModal, setShowCreateHouseModal] = useState(false);
  const [houseForm] = Form.useForm();
  const [stats, setStats] = useState({
    houseCount: 0,
    orderCount: 0,
    totalIncome: 0,
    reviewCount: 0,
  });

  const tabItems = [
    { key: 'overview', label: '数据概览' },
    { key: 'houses', label: '房源管理' },
    { key: 'orders', label: '订单管理' },
    { key: 'reviews', label: '评价管理' },
  ];

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'houses') {
      fetchMyHouses();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const houseResult = await houseService.getMyHouses({ limit: 100 });
      const orderResult = await orderService.getOrders({ role: 'landlord', limit: 100 });
      const reviewResult = await userService.getMyReviews({ role: 'landlord', limit: 100 });

      const houseCount = houseResult.pagination?.total || 0;
      const orderCount = orderResult.pagination?.total || 0;
      const reviewCount = reviewResult.pagination?.total || 0;
      const totalIncome = (orderResult.orders || [])
        .filter((o) => o.status === 'completed' || o.status === 'checked_out')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        houseCount,
        orderCount,
        totalIncome,
        reviewCount,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyHouses = async () => {
    try {
      setLoading(true);
      const result = await houseService.getMyHouses({ limit: 50 });
      setMyHouses(result.houses || []);
    } catch (error) {
      console.error('获取我的房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrders({ role: 'landlord', limit: 50 });
      setOrders(result.orders || []);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const result = await userService.getMyReviews({ role: 'landlord', limit: 50 });
      setReviews(result.reviews || []);
    } catch (error) {
      console.error('获取评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleCreateHouseClick = () => {
    houseForm.resetFields();
    setShowCreateHouseModal(true);
  };

  const handleSubmitHouse = async (values) => {
    try {
      setLoading(true);

      const houseData = {
        ...values,
        images: values.images
          ? values.images.split(',').map((url) => url.trim())
          : [],
        amenities: values.amenities || [],
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
        status: 'published',
      };

      await houseService.createHouse(houseData);
      message.success('房源发布成功！');
      setShowCreateHouseModal(false);
      fetchMyHouses();
      fetchStats();
    } catch (error) {
      console.error('发布房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      setLoading(true);
      await orderService.updateOrderStatus(orderId, action);
      message.success('操作成功');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('操作订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusInfo = (status) => {
    const statusMap = {
      pending: { label: '待支付', color: 'orange' },
      paid: { label: '已支付', color: 'blue' },
      confirmed: { label: '已确认', color: 'cyan' },
      checked_in: { label: '已入住', color: 'green' },
      checked_out: { label: '已退房', color: 'purple' },
      completed: { label: '已完成', color: 'success' },
      cancelled: { label: '已取消', color: 'default' },
      refunded: { label: '已退款', color: 'error' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const getHouseStatusInfo = (status) => {
    const statusMap = {
      published: { label: '已上架', color: 'green' },
      draft: { label: '草稿', color: 'default' },
      deleted: { label: '已删除', color: 'red' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const renderOverview = () => (
    <Card bordered={false}>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: '#f0f5ff' }}>
            <Statistic
              title="房源数量"
              value={stats.houseCount}
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic
              title="订单总数"
              value={stats.orderCount}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: '#fff7e6' }}>
            <Statistic
              title="总收入"
              value={stats.totalIncome}
              prefix="¥"
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: '#fff1f0' }}>
            <Statistic
              title="收到评价"
              value={stats.reviewCount}
              prefix={<StarOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="最近订单" bordered={false}>
            {orders.length === 0 ? (
              <Empty description="暂无订单" />
            ) : (
              <List
                dataSource={orders.slice(0, 5)}
                renderItem={(order) => {
                  const statusInfo = getOrderStatusInfo(order.status);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={48}
                            icon={<HomeOutlined />}
                            src={order.house?.images?.[0]}
                            style={{ backgroundColor: '#ff4d4f' }}
                          />
                        }
                        title={
                          <Row justify="space-between">
                            <Col>
                              <Text strong>{order.house?.title || order.orderNo}</Text>
                            </Col>
                            <Col>
                              <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                            </Col>
                          </Row>
                        }
                        description={
                          <div>
                            <Text type="secondary">
                              {dayjs(order.checkInDate).format('MM-DD')} 至{' '}
                              {dayjs(order.checkOutDate).format('MM-DD')} · {order.nights} 晚
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                                ¥{order.payableAmount || order.totalAmount}
                              </Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="最近评价" bordered={false}>
            {reviews.length === 0 ? (
              <Empty description="暂无评价" />
            ) : (
              <List
                dataSource={reviews.slice(0, 5)}
                renderItem={(review) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={40}
                          icon={<UserOutlined />}
                          src={review.user?.avatar}
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      }
                      title={
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space>
                              <Text strong>{review.user?.nickname || '房客'}</Text>
                              {review.rating && (
                                <Space>
                                  <StarOutlined style={{ color: '#faad14' }} />
                                  <Text>{review.rating}</Text>
                                </Space>
                              )}
                            </Space>
                          </Col>
                          <Col>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(review.createdAt).format('MM-DD')}
                            </Text>
                          </Col>
                        </Row>
                      }
                      description={
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                          {review.content}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderHouses = () => (
    <Card
      title="我的房源"
      bordered={false}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHouseClick}>
          发布新房源
        </Button>
      }
    >
      <Spin spinning={loading}>
        {myHouses.length === 0 ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  您还没有发布过房源
                </Text>
                <Button type="primary" onClick={handleCreateHouseClick}>
                  发布房源
                </Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Row gutter={[24, 24]}>
            {myHouses.map((house) => {
              const statusInfo = getHouseStatusInfo(house.status);
              return (
                <Col xs={24} sm={12} lg={8} key={house.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/houses/${house.id}`)}
                    bodyStyle={{ padding: 0 }}
                  >
                    <div
                      style={{
                        height: 160,
                        backgroundImage: `url(${house.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px 8px 0 0',
                        position: 'relative',
                      }}
                    >
                      <Tag
                        color={statusInfo.color}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }}
                      >
                        {statusInfo.label}
                      </Tag>
                      <Tag
                        color="blue"
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                        }}
                      >
                        {house.city}
                      </Tag>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div
                        className="ellipsis"
                        style={{ fontWeight: 500, marginBottom: 8 }}
                      >
                        {house.title}
                      </div>
                      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                        <Col>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            {house.district}
                          </Text>
                        </Col>
                        <Col>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {house.bedrooms}室{house.bathrooms}卫
                          </Text>
                        </Col>
                      </Row>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
                          ¥{house.pricePerNight}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            /晚
                          </Text>
                        </Text>
                        <Space>
                          {house.rating && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <StarOutlined style={{ color: '#faad14', marginRight: 2 }} />
                              {house.rating}
                            </Text>
                          )}
                          {house.reviewCount !== undefined && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {house.reviewCount} 评价
                            </Text>
                          )}
                        </Space>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <Space size={8}>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/houses/${house.id}`);
                          }}
                        >
                          <EyeOutlined /> 查看
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            message.info('编辑功能开发中...');
                          }}
                        >
                          <EditOutlined /> 编辑
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>
    </Card>
  );

  const renderOrders = () => (
    <Card title="订单管理" bordered={false}>
      <Spin spinning={loading}>
        {orders.length === 0 ? (
          <Empty description="暂无订单" />
        ) : (
          <List
            dataSource={orders}
            renderItem={(order) => {
              const statusInfo = getOrderStatusInfo(order.status);
              return (
                <Card
                  key={order.id}
                  style={{ marginBottom: 16 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  hoverable
                >
                  <Row gutter={[24, 8]}>
                    <Col flex="none">
                      <Avatar
                        size={80}
                        shape="square"
                        icon={<HomeOutlined />}
                        src={order.house?.images?.[0]}
                        style={{ backgroundColor: '#ff4d4f', borderRadius: 8 }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                        <Col>
                          <Text strong style={{ fontSize: 16 }}>
                            {order.house?.title || order.orderNo}
                          </Text>
                        </Col>
                        <Col>
                          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                        </Col>
                      </Row>

                      <Row gutter={[24, 8]} style={{ marginBottom: 8 }}>
                        <Col>
                          <Text type="secondary">
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {dayjs(order.checkInDate).format('YYYY-MM-DD')} 至{' '}
                            {dayjs(order.checkOutDate).format('YYYY-MM-DD')}
                          </Text>
                        </Col>
                        <Col>
                          <Text type="secondary">{order.nights} 晚 · {order.guests} 人</Text>
                        </Col>
                        <Col>
                          <Text type="secondary">订单号：{order.orderNo}</Text>
                        </Col>
                      </Row>

                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
                            ¥{order.payableAmount || order.totalAmount}
                          </Text>
                        </Col>
                        <Col>
                          <Space>
                            {order.status === 'paid' && (
                              <Button
                                type="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderAction(order.id, 'confirm');
                                }}
                              >
                                确认订单
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                type="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderAction(order.id, 'check_in');
                                }}
                              >
                                办理入住
                              </Button>
                            )}
                            {order.status === 'checked_in' && (
                              <Button
                                type="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderAction(order.id, 'check_out');
                                }}
                              >
                                办理退房
                              </Button>
                            )}
                            <Button
                              type="link"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/orders/${order.id}`);
                              }}
                            >
                              订单详情 <RightOutlined />
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              );
            }}
          />
        )}
      </Spin>
    </Card>
  );

  const renderReviews = () => (
    <Card title="评价管理" bordered={false}>
      <Spin spinning={loading}>
        {reviews.length === 0 ? (
          <Empty description="暂无评价" />
        ) : (
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <Card key={review.id} style={{ marginBottom: 16 }}>
                <Row gutter={[24, 8]}>
                  <Col flex="none">
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      src={review.user?.avatar}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                      <Col>
                        <Space>
                          <Text strong>{review.user?.nickname || '房客'}</Text>
                          {review.rating && (
                            <Space>
                              <StarOutlined style={{ color: '#faad14' }} />
                              <Text>{review.rating} 分</Text>
                            </Space>
                          )}
                        </Space>
                      </Col>
                      <Col>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Col>
                    </Row>

                    <Paragraph style={{ marginBottom: 0 }}>{review.content}</Paragraph>

                    {review.house && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          房源：{review.house.title}
                        </Text>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            )}
          />
        )}
      </Spin>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'houses':
        return renderHouses();
      case 'orders':
        return renderOrders();
      case 'reviews':
        return renderReviews();
      default:
        return renderOverview();
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <HomeOutlined style={{ marginRight: 8 }} />
            房东后台
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            管理您的房源、订单和评价
          </Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHouseClick}>
            发布房源
          </Button>
        </Col>
      </Row>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
        />

        <Divider style={{ margin: '16px 0' }} />

        {renderContent()}
      </Card>

      <Modal
        title="发布房源"
        open={showCreateHouseModal}
        onCancel={() => setShowCreateHouseModal(false)}
        footer={null}
        width={800}
      >
        <Form
          form={houseForm}
          layout="vertical"
          onFinish={handleSubmitHouse}
          initialValues={{
            maxGuests: 2,
            rooms: 1,
            bedrooms: 1,
            bathrooms: 1,
            area: 50,
            cleaningFee: 0,
            securityDeposit: 0,
            minNights: 1,
            maxNights: 365,
            isInstantBook: true,
          }}
        >
          <Title level={5}>基本信息</Title>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="房源标题"
                name="title"
                rules={[{ required: true, message: '请输入房源标题' }]}
              >
                <Input placeholder="例如：温馨一居室 近地铁 精装修" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="房源类型"
                name="type"
                rules={[{ required: true, message: '请选择房源类型' }]}
              >
                <Select placeholder="请选择房源类型" options={houseTypes} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={8}>
              <Form.Item
                label="城市"
                name="city"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select
                  placeholder="请选择城市"
                  showSearch
                  options={cities.map((c) => ({ label: c, value: c }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="区域" name="district">
                <Input placeholder="例如：朝阳区" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="详细地址"
                name="address"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="房源描述"
            name="description"
            rules={[{ required: true, message: '请输入房源描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述您的房源特色和设施" />
          </Form.Item>

          <Form.Item label="图片链接（多个用逗号分隔）" name="images">
            <TextArea
              rows={2}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </Form.Item>

          <Divider />
          <Title level={5}>房屋信息</Title>

          <Row gutter={[16, 0]}>
            <Col span={6}>
              <Form.Item
                label="房屋数量"
                name="rooms"
                rules={[{ required: true, message: '请输入房屋数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="卧室数量"
                name="bedrooms"
                rules={[{ required: true, message: '请输入卧室数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="卫生间数量"
                name="bathrooms"
                rules={[{ required: true, message: '请输入卫生间数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="最大入住人数"
                name="maxGuests"
                rules={[{ required: true, message: '请输入最大入住人数' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="面积（平方米）" name="area">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="每晚价格（元）"
                name="pricePerNight"
                rules={[{ required: true, message: '请输入每晚价格' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={8}>
              <Form.Item label="清洁费（元）" name="cleaningFee">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="押金（元）" name="securityDeposit">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="设施服务" name="amenities">
                <Select mode="multiple" placeholder="请选择设施" options={amenities} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>预订规则</Title>

          <Row gutter={[16, 0]}>
            <Col span={8}>
              <Form.Item label="最少入住晚数" name="minNights">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最多入住晚数" name="maxNights">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="是否支持闪订" name="isInstantBook" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="房源标签（多个用逗号分隔）" name="tags">
            <Input placeholder="例如：海景房, 亲子游, 近地铁" />
          </Form.Item>

          <Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Button block onClick={() => setShowCreateHouseModal(false)}>
                  取消
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  发布房源
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LandlordDashboard;