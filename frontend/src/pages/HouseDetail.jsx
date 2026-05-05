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
  Carousel,
  Divider,
  Spin,
  Empty,
  Descriptions,
  Avatar,
  Rate,
  message,
  DatePicker,
  InputNumber,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  List,
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  HomeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarOutlined,
  PhoneOutlined,
  MessageOutlined,
  HomeFilled,
  WifiOutlined,
  CarOutlined,
  CoffeeOutlined,
  ToolOutlined,
  SafetyOutlined,
  LockOutlined,
  CheckOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { houseService } from '@/services/houseService';
import { orderService } from '@/services/orderService';
import { useUserStore } from '@/stores/userStore';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const amenityIcons = {
  wifi: <WifiOutlined />,
  parking: <CarOutlined />,
  kitchen: <CoffeeOutlined />,
  washing_machine: <ToolOutlined />,
  air_conditioner: <SafetyOutlined />,
  heater: <SafetyOutlined />,
  tv: <SafetyOutlined />,
  refrigerator: <SafetyOutlined />,
  balcony: <SafetyOutlined />,
  swimming_pool: <SafetyOutlined />,
  gym: <SafetyOutlined />,
  elevator: <SafetyOutlined />,
  smoking_allowed: <CheckOutlined />,
  pet_allowed: <CheckOutlined />,
};

const amenityLabels = {
  wifi: 'WiFi',
  parking: '免费停车',
  kitchen: '厨房',
  washing_machine: '洗衣机',
  air_conditioner: '空调',
  heater: '暖气',
  tv: '电视',
  refrigerator: '冰箱',
  balcony: '阳台',
  swimming_pool: '泳池',
  gym: '健身房',
  elevator: '电梯',
  smoking_allowed: '允许吸烟',
  pet_allowed: '允许携带宠物',
};

function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useUserStore();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookingForm] = Form.useForm();
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    if (id) {
      fetchHouseDetail();
    }
  }, [id]);

  const fetchHouseDetail = async () => {
    try {
      setLoading(true);
      const result = await houseService.getHouseDetail(id);
      setHouse(result);
      setIsFavorite(result.isFavorite || false);
    } catch (error) {
      console.error('获取房源详情失败:', error);
      message.error('获取房源详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      const result = await houseService.toggleFavorite(id);
      setIsFavorite(result.isFavorite);
      message.success(result.isFavorite ? '已收藏' : '已取消收藏');
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const handleBookClick = () => {
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      return Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const handleSubmitBooking = async (values) => {
    try {
      setBookingLoading(true);
      const nights = calculateNights();
      if (nights <= 0) {
        message.error('请选择正确的入住和退房日期');
        return;
      }

      const orderData = {
        houseId: id,
        checkInDate: checkInDate.format('YYYY-MM-DD'),
        checkOutDate: checkOutDate.format('YYYY-MM-DD'),
        guests: values.guests || 1,
        specialRequests: values.specialRequests,
        guestNames: values.guestNames ? values.guestNames.split(',').map(n => n.trim()) : [],
        guestPhones: values.guestPhones ? values.guestPhones.split(',').map(p => p.trim()) : [],
      };

      const result = await orderService.createOrder(orderData);
      message.success('订单创建成功，请支付');
      setShowBookingModal(false);
      navigate(`/orders/${result.id}`);
    } catch (error) {
      console.error('创建订单失败:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleContactLandlord = () => {
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    message.info('消息功能开发中...');
  };

  const getHouseTypeLabel = (type) => {
    const types = {
      apartment: '公寓',
      house: '住宅',
      villa: '别墅',
      loft: 'LOFT',
      studio: '单间',
    };
    return types[type] || type;
  };

  const renderHouseRules = () => {
    if (!house?.houseRules) return null;
    const rules = house.houseRules;
    return (
      <Row gutter={[16, 16]}>
        {rules.checkInTime && (
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <Text strong>入住时间</Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">{rules.checkInTime} 后</Text>
              </div>
            </div>
          </Col>
        )}
        {rules.checkOutTime && (
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <Text strong>退房时间</Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">{rules.checkOutTime} 前</Text>
              </div>
            </div>
          </Col>
        )}
        <Col xs={24} sm={8}>
          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <Text strong>最少入住</Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">{house.minNights || 1} 晚起</Text>
            </div>
          </div>
        </Col>
      </Row>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!house) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="房源不存在" />
      </div>
    );
  }

  const nights = calculateNights();
  const totalPrice = nights * house.pricePerNight;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {house.images && house.images.length > 0 ? (
            <>
              <Col xs={24} md={16}>
                <div
                  style={{
                    height: 400,
                    backgroundImage: `url(${house.images[currentImageIndex] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />
              </Col>
              <Col xs={24} md={8}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: 400 }}>
                  {house.images.slice(1, 5).map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index + 1)}
                      style={{
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 8,
                        cursor: 'pointer',
                        opacity: currentImageIndex === index + 1 ? 1 : 0.7,
                      }}
                    />
                  ))}
                </div>
              </Col>
            </>
          ) : (
            <Col span={24}>
              <div
                style={{
                  height: 400,
                  backgroundImage: `url(https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 8,
                }}
              />
            </Col>
          )}
        </Row>
      </div>

      <Row gutter={[32, 24]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Tag color="blue">{house.city}</Tag>
                <Tag color="green">{getHouseTypeLabel(house.type)}</Tag>
                {house.isInstantBook && <Tag color="purple">闪订</Tag>}
              </Space>
            </div>

            <Title level={2} style={{ marginBottom: 8 }}>
              {house.title}
            </Title>

            <Space style={{ marginBottom: 16 }}>
              <Space>
                <EnvironmentOutlined style={{ color: '#666' }} />
                <Text type="secondary">{house.address}</Text>
              </Space>
              {house.rating && (
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text strong>{house.rating}</Text>
                  <Text type="secondary">({house.reviewCount || 0} 条评价)</Text>
                </Space>
              )}
            </Space>

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              <HomeFilled style={{ marginRight: 8, color: '#ff4d4f' }} />
              房源介绍
            </Title>

            <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
              {house.description || '暂无详细描述'}
            </Paragraph>

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              房源信息
            </Title>

            <Row gutter={[24, 16]}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    <UserOutlined />
                  </div>
                  <Text strong>可住 {house.maxGuests} 人</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    <HomeOutlined />
                  </div>
                  <Text strong>{house.bedrooms || 0} 间卧室</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    <HomeOutlined />
                  </div>
                  <Text strong>{house.bathrooms || 0} 间卫浴</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    <EnvironmentOutlined />
                  </div>
                  <Text strong>{house.area || 0} ㎡</Text>
                </div>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              设施服务
            </Title>

            {house.amenities && house.amenities.length > 0 ? (
              <Row gutter={[16, 16]}>
                {house.amenities.map((amenity) => (
                  <Col xs={12} sm={6} key={amenity}>
                    <Space>
                      {amenityIcons[amenity] || <CheckOutlined />}
                      <Text>{amenityLabels[amenity] || amenity}</Text>
                    </Space>
                  </Col>
                ))}
              </Row>
            ) : (
              <Text type="secondary">暂无设施信息</Text>
            )}

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              入住须知
            </Title>

            {renderHouseRules()}

            {house.reviews && house.reviews.length > 0 && (
              <>
                <Divider />

                <Title level={4} style={{ marginBottom: 16 }}>
                  房客评价 ({house.reviews.length})
                </Title>

                <List
                  dataSource={house.reviews}
                  renderItem={(review) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={48}
                            icon={<UserOutlined />}
                            src={review.user?.avatar}
                            style={{ backgroundColor: '#ff4d4f' }}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{review.user?.nickname || '匿名用户'}</Text>
                            <Rate disabled defaultValue={review.rating} />
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(review.createdAt).format('YYYY-MM-DD')}
                            </Text>
                            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                              {review.content}
                            </Paragraph>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              position: 'sticky',
              top: 24,
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Space align="baseline">
                <Text style={{ fontSize: 28, fontWeight: 600, color: '#ff4d4f' }}>
                  ¥{house.pricePerNight}
                </Text>
                <Text type="secondary">/晚</Text>
              </Space>
              {house.rating && (
                <Space style={{ marginTop: 4 }}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text strong>{house.rating}</Text>
                  <Text type="secondary">· {house.reviewCount || 0} 条评价</Text>
                </Space>
              )}
            </div>

            <Divider />

            <Form layout="vertical">
              <Form.Item label="选择日期">
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  placeholder={['入住', '退房']}
                  onChange={(dates) => {
                    if (dates) {
                      setCheckInDate(dates[0]);
                      setCheckOutDate(dates[1]);
                    } else {
                      setCheckInDate(null);
                      setCheckOutDate(null);
                    }
                  }}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf('day')
                  }
                />
              </Form.Item>

              <Form.Item label="入住人数">
                <Select
                  style={{ width: '100%' }}
                  size="large"
                  value={guests}
                  onChange={setGuests}
                  options={Array.from({ length: house.maxGuests || 10 }, (_, i) => ({
                    label: `${i + 1} 人`,
                    value: i + 1,
                  }))}
                />
              </Form.Item>
            </Form>

            {checkInDate && checkOutDate && nights > 0 && (
              <div
                style={{
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Text>¥{house.pricePerNight} × {nights} 晚</Text>
                <Text>¥{totalPrice}</Text>
              </Row>
                {house.cleaningFee > 0 && (
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>清洁费</Text>
                    <Text>¥{house.cleaningFee}</Text>
                  </Row>
                )}
                {house.securityDeposit > 0 && (
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>押金</Text>
                    <Text>¥{house.securityDeposit}</Text>
                  </Row>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Text strong>合计</Text>
                  <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                    ¥{totalPrice + (house.cleaningFee || 0) + (house.securityDeposit || 0)}
                  </Text>
                </Row>
              </div>
            )}

            <Button
              type="primary"
              size="large"
              block
              onClick={handleBookClick}
              style={{ height: 48, fontSize: 16, marginBottom: 12 }}
            >
              立即预订
            </Button>

            <Row gutter={[16, 0]}>
              <Col flex={12}>
                <Button
                  block
                  icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? '已收藏' : '收藏'}
                </Button>
              </Col>
              <Col flex={12}>
                <Button
                  block
                  icon={<MessageOutlined />}
                  onClick={handleContactLandlord}
                >
                  联系房东
                </Button>
              </Col>
            </Row>

            {house.landlord && (
              <>
                <Divider />
                <div>
                  <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                    房东
                  </Text>
                  <Space>
                    <Avatar
                      size={40}
                      icon={<UserOutlined />}
                      src={house.landlord.avatar}
                      style={{ backgroundColor: '#ff4d4f' }}
                    />
                    <div>
                      <Text strong>{house.landlord.nickname}</Text>
                      {house.landlord.isVerified && (
                        <Tag color="green" style={{ marginLeft: 8 }}>
                        已认证
                      </Tag>
                      )}
                    </div>
                  </Space>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认预订"
        open={showBookingModal}
        onCancel={() => setShowBookingModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={bookingForm}
          layout="vertical"
          onFinish={handleSubmitBooking}
        >
          <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <Row gutter={[16, 8]}>
              <Col span={6}>
                <Text type="secondary">房源</Text>
              </Col>
              <Col span={18}>
                <Text strong>{house.title}</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary">日期</Text>
              </Col>
              <Col span={18}>
                <Text>
                  {checkInDate?.format('YYYY-MM-DD')} 至 {checkOutDate?.format('YYYY-MM-DD')}
                  ({nights} 晚)
                </Text>
              </Col>
              <Col span={6}>
                <Text type="secondary">人数</Text>
              </Col>
              <Col span={18}>
                <Text>{guests} 人</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary">价格</Text>
              </Col>
              <Col span={18}>
                <Text strong style={{ color: '#ff4d4f' }}>
                  ¥{totalPrice + (house.cleaningFee || 0) + (house.securityDeposit || 0)}
                </Text>
              </Col>
            </Row>
          </div>

          <Form.Item
            label="入住客人姓名"
            name="guestNames"
            rules={[{ required: true, message: '请输入客人姓名' }]}
          >
            <Input placeholder="多个姓名用逗号分隔" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="guestPhones"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="多个电话用逗号分隔" />
          </Form.Item>

          <Form.Item label="特殊要求" name="specialRequests">
            <Input.TextArea
              placeholder="有什么特殊需求吗？（可选）"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={bookingLoading}
              style={{ height: 48, fontSize: 16 }}
            >
              确认预订并支付
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default HouseDetail;